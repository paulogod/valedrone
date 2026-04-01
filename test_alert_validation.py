import unittest

from alert_validation import (
    ALERT_TYPES_PRIORITY,
    InvalidAlertTypeError,
    MissingRequiredFieldError,
    MissingAlertHandlersError,
    parse_alert_event,
    parse_alert_event_or_none,
    sort_alert_events,
    validate_alert_handlers,
)


class TestAlertValidation(unittest.TestCase):
    def test_parse_ok(self):
        payload = {
            "timestamp": "1651347332",
            "alert_type": "NoGloves",
            "src_cam": "PETR_CAM01",
            "bounding_box": [(100, 200), (150, 250)],
            "alert_confidence": 0.85,
        }
        evt = parse_alert_event(payload)
        self.assertEqual(evt.alert_type, "NoGloves")
        self.assertEqual(evt.timestamp, 1651347332)
        self.assertEqual(evt.bounding_box, ((100, 200), (150, 250)))
        self.assertAlmostEqual(evt.alert_confidence, 0.85)

    def test_missing_fields(self):
        with self.assertRaises(MissingRequiredFieldError) as ctx:
            parse_alert_event({"alert_type": "NoGloves"})
        print(f"Erro esperado (campos obrigatórios ausentes): {ctx.exception}")

    def test_invalid_alert_type(self):
        payload = {
            "timestamp": 1,
            "alert_type": "NoBoots",
            "src_cam": "PETR_CAM01",
            "bounding_box": [(0, 0), (1, 1)],
            "alert_confidence": 0.5,
        }
        with self.assertRaises(InvalidAlertTypeError) as ctx:
            parse_alert_event(payload)
        print(f"Erro esperado (alert_type inválido): {ctx.exception}")

    def test_order_priority(self):
        a = parse_alert_event(
            {
                "timestamp": 10,
                "alert_type": "NoHardHat",
                "src_cam": "C1",
                "bounding_box": [(0, 0), (1, 1)],
                "alert_confidence": 0.9,
            }
        )
        b = parse_alert_event(
            {
                "timestamp": 20,
                "alert_type": "RedZoneIntrusion",
                "src_cam": "C1",
                "bounding_box": [(0, 0), (1, 1)],
                "alert_confidence": 0.9,
            }
        )
        c = parse_alert_event(
            {
                "timestamp": 30,
                "alert_type": "NoGloves",
                "src_cam": "C1",
                "bounding_box": [(0, 0), (1, 1)],
                "alert_confidence": 0.9,
            }
        )
        d = parse_alert_event(
            {
                "timestamp": 40,
                "alert_type": "NoGlasses",
                "src_cam": "C1",
                "bounding_box": [(0, 0), (1, 1)],
                "alert_confidence": 0.9,
            }
        )

        ordered = sort_alert_events([a, b, c, d])

        # Print dos alertas solicitados na ordem preferencial.
        print("Alertas (ordem preferencial):")
        for evt in ordered:
            print(f"- {evt.alert_type}")

        # Requisito: NoGloves, NoHardHat, depois tanto faz (entre os demais).
        self.assertEqual(ordered[0].alert_type, "NoGloves")
        self.assertEqual(ordered[1].alert_type, "NoHardHat")
        self.assertEqual(
            set(e.alert_type for e in ordered),
            {"NoGloves", "NoHardHat", "NoGlasses", "RedZoneIntrusion"},
        )

    def test_green_zone_suppresses_alert(self):
        # Green Zone cobre a bounding box do evento -> deve ser suprimido (None)
        green_zone = ((0, 0), (500, 500))
        payload = {
            "timestamp": 123,
            "alert_type": "NoGloves",
            "src_cam": "PETR_CAM01",
            "bounding_box": [(100,
             200), (150, 250)],
            "alert_confidence": 0.85,
        }

        evt = parse_alert_event_or_none(payload, green_zone=green_zone)
        print("Green Zone ativa: alerta suprimido." if evt is None else "Green Zone inativa: alerta disparado.")
        self.assertIsNone(evt)

    def test_validate_handlers_mapping(self):
        handlers = {t: object() for t in ALERT_TYPES_PRIORITY}
        validate_alert_handlers(handlers)  # não deve lançar

    def test_validate_handlers_missing(self):
        handlers = {"NoGloves": object()}
        with self.assertRaises(MissingAlertHandlersError):
            validate_alert_handlers(handlers)


if __name__ == "__main__":
    unittest.main()

