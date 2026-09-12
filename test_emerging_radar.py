# ==============================================================================
# UNIT TESTS FOR EMERGING RADAR ENGINE (Part 68 & Part 69)
# ==============================================================================

import unittest
from datetime import datetime, timezone, timedelta
from emerging_radar import (
    calculate_median,
    calculate_upload_consistency,
    compute_radar_score,
    classify_presets_and_breakout,
    analyze_channel_metrics,
    update_daily_snapshots
)

class TestEmergingRadar(unittest.TestCase):

    def test_calculate_median(self):
        # Empty array
        self.assertEqual(calculate_median([]), 0.0)
        # Single element
        self.assertEqual(calculate_median([5000]), 5000.0)
        # Odd count
        self.assertEqual(calculate_median([1000, 5000, 9000]), 5000.0)
        # Even count
        self.assertEqual(calculate_median([1000, 2000, 4000, 8000]), 3000.0)
        # Unsorted with zeros
        self.assertEqual(calculate_median([10000, 0, 5000]), 5000.0)

    def test_upload_consistency(self):
        # Empty or single interval
        self.assertEqual(calculate_upload_consistency([]), 65.0)
        self.assertEqual(calculate_upload_consistency([3.0]), 65.0)
        # Perfect consistent intervals (every 3 days)
        perfect = [3.0, 3.0, 3.0, 3.0]
        score_perfect = calculate_upload_consistency(perfect)
        self.assertGreaterEqual(score_perfect, 95.0)
        # Highly erratic intervals
        erratic = [0.1, 0.1, 0.1, 30.0, 45.0]
        score_erratic = calculate_upload_consistency(erratic)
        self.assertLessEqual(score_erratic, 50.0)

    def test_radar_score_calculation(self):
        # Channel with max values
        max_metrics = {
            "viral_repeat_count": 5,      # 15đ
            "hit_rate": 0.70,             # 15đ -> Repeatability = 30đ
            "median_view_velocity": 10000, # 20đ
            "median_views_per_sub": 20,   # 15đ
            "views_90d": 500000,          # 15đ
        }
        score, breakdown = compute_radar_score(max_metrics, active_age_days=25, upload_consistency=100.0)
        self.assertEqual(breakdown["repeatability_score"], 30.0)
        self.assertEqual(breakdown["velocity_score"], 20.0)
        self.assertEqual(breakdown["view_sub_score"], 15.0)
        self.assertEqual(breakdown["views_90d_score"], 15.0)
        self.assertEqual(breakdown["freshness_score"], 10.0) # <= 30d
        self.assertEqual(breakdown["consistency_score"], 10.0) # 100% -> 10đ
        self.assertEqual(score, 100.0)

        # Moderate channel
        mod_metrics = {
            "viral_repeat_count": 2,      # (2/5)*15 = 6.0đ
            "hit_rate": 0.35,             # (0.35/0.70)*15 = 7.5đ -> 13.5đ
            "median_view_velocity": 5000, # (5000/10000)*20 = 10.0đ
            "median_views_per_sub": 10,   # (10/20)*15 = 7.5đ
            "views_90d": 250000,          # (250000/500000)*15 = 7.5đ
        }
        mod_score, mod_breakdown = compute_radar_score(mod_metrics, active_age_days=50, upload_consistency=80.0)
        # Freshness for 50d = 8.0, Consistency for 80 = 8.0
        expected = round(13.5 + 10.0 + 7.5 + 7.5 + 8.0 + 8.0, 1)
        self.assertEqual(mod_score, expected)

    def test_presets_and_breakout(self):
        # 1. Exploding channel
        presets, breakout = classify_presets_and_breakout(
            subscriber_count=3500,
            active_age_days=45,
            views_90d=250000,
            median_views_90d=15000,
            max_views_90d=80000,
            viral_repeat_count=4,
            median_views_per_sub=6.5,
            radar_score=82.0,
            radar_score_change_7d=18.0
        )
        self.assertIn("EXPLODING", presets)
        self.assertIn("EMERGING", presets)
        self.assertIn("BREAKOUT", presets)
        self.assertTrue(breakout)

        # 2. Hidden Gem
        presets_gem, _ = classify_presets_and_breakout(
            subscriber_count=1800,
            active_age_days=70,
            views_90d=120000,
            median_views_90d=4000,
            max_views_90d=50000,
            viral_repeat_count=2,
            median_views_per_sub=3.0,
            radar_score=62.0,
            radar_score_change_7d=5.0
        )
        self.assertIn("HIDDEN_GEM", presets_gem)

        # 3. One Hit Wonder
        presets_ohw, _ = classify_presets_and_breakout(
            subscriber_count=2000,
            active_age_days=60,
            views_90d=110000,
            median_views_90d=2500,
            max_views_90d=105000,
            viral_repeat_count=1,
            median_views_per_sub=1.2,
            radar_score=42.0,
            radar_score_change_7d=2.0
        )
        self.assertIn("ONE_HIT_WONDER", presets_ohw)

    def test_edge_cases_safety(self):
        now_dt = datetime.now(timezone.utc)
        # Channel with 0 subscribers
        zero_sub_profile = {"subscribers": 0, "title": "Zero Subs"}
        res = analyze_channel_metrics(zero_sub_profile, [], now_dt)
        self.assertIsInstance(res, dict)
        self.assertEqual(res["subscriber_count"], 1) # Clamped to 1, no ZeroDivisionError

        # Channel with 1 video only
        one_video_profile = {"subscribers": 500, "title": "One Vid"}
        raw_vid = [{
            "video_id": "test_1",
            "title": "Single Video",
            "url": "https://youtube.com/watch?v=test_1",
            "thumbnail": "",
            "published_at": (now_dt - timedelta(days=5)).isoformat(),
            "views": 50000,
            "content_type": "LONG_FORM"
        }]
        res_one = analyze_channel_metrics(one_video_profile, raw_vid, now_dt)
        self.assertEqual(res_one["videos_90d"], 1)
        self.assertEqual(res_one["viral_repeat_count"], 1)
        self.assertGreater(res_one["radar_score"], 0)

    def test_discord_channel_discovery_alert(self):
        from unittest.mock import patch, MagicMock
        from discord_notifier import send_channel_discovery_alert

        # 1. Missing webhook URL should return False without crashing
        self.assertFalse(send_channel_discovery_alert("", {}))
        self.assertFalse(send_channel_discovery_alert(None, {}))

        # 2. Valid webhook URL with mock
        sample_channel = {
            "title": "Smart Scrap Lab",
            "handle": "@SmartScrapLab",
            "channel_id": "UC_test_scrap_999",
            "subscriber_count": 3420,
            "subscribers_formatted": "3.42K",
            "active_age_days": 48,
            "radar_score": 88.5,
            "views_90d": 640000,
            "median_views_90d": 92000,
            "median_views_per_sub": 26.9,
            "viral_repeat_count": 5,
            "hit_rate": 0.83,
            "median_view_velocity": 14200.0,
            "presets": ["SUPER_EARLY_BREAKOUT"],
            "star_video": {
                "title": "Recycle Broken Bits",
                "url": "https://youtube.com/watch?v=123",
                "views": 360000,
                "views_per_sub": 105.2,
                "view_velocity": 28500.0
            }
        }
        sample_ai = {
            "result": {
                "executive_summary": "Tăng trưởng tốt.",
                "why_channel_is_growing": {"primary_growth_drivers": ["Driver A"]}
            }
        }

        mock_resp = MagicMock()
        mock_resp.status = 204
        mock_resp.__enter__.return_value = mock_resp

        with patch("urllib.request.urlopen", return_value=mock_resp) as mock_urlopen:
            # Test new_channel alert
            success_new = send_channel_discovery_alert(
                "https://discord.com/api/webhooks/123/abc",
                sample_channel,
                sample_channel["star_video"],
                sample_ai,
                alert_type="new_channel"
            )
            self.assertTrue(success_new)
            self.assertTrue(mock_urlopen.called)

            # Test breakout alert
            success_breakout = send_channel_discovery_alert(
                "https://discord.com/api/webhooks/123/abc",
                sample_channel,
                sample_channel["star_video"],
                sample_ai,
                alert_type="breakout"
            )
            self.assertTrue(success_breakout)

if __name__ == "__main__":
    unittest.main()

