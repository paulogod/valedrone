from __future__ import annotations

import json
from dataclasses import dataclass
from json import JSONDecodeError
from typing import Any, Mapping, Sequence


# Ordem de prioridade solicitada:
# principais: NoGloves, NoHardHat
ALERT_TYPES_PRIORITY: tuple[str, ...] = (
    "NoGloves",
    "NoHardHat",
    # após os dois principais, pode ser qualquer ordem (mantemos determinística)
    "RedZoneIntrusion",
    "NoGlasses",
)

ALERT_TYPES_ALLOWED = set(ALERT_TYPES_PRIORITY)

# Mesmo formato do JSON: [(x1, y1), (x2, y2)]
BoundingBox = tuple[tuple[int, int], tuple[int, int]]


class AlertValidationError(ValueError):
    """Erro base para validação de eventos de alerta."""


class InvalidAlertJSONError(AlertValidationError):
    def __init__(self, message: str):
        super().__init__(message)


class MissingRequiredFieldError(AlertValidationError):
    def __init__(self, missing_fields: Sequence[str], available_fields: Sequence[str]):
        super().__init__(
            "JSON inválido: campos obrigatórios ausentes: "
            f"{list(missing_fields)}. Campos disponíveis: {list(available_fields)}"
        )
        self.missing_fields = tuple(missing_fields)
        self.available_fields = tuple(available_fields)


class InvalidFieldTypeError(AlertValidationError):
    def __init__(self, field: str, expected: str, got: str):
        super().__init__(f"Campo '{field}' inválido: esperado {expected}, recebido {got}.")
        self.field = field
        self.expected = expected
        self.got = got


class InvalidAlertTypeError(AlertValidationError):
    def __init__(self, alert_type: Any, allowed_types: Sequence[str] = ALERT_TYPES_PRIORITY):
        super().__init__(
            "alert_type inválido: "
            f"{alert_type!r}. Permitidos (prioridade): {list(allowed_types)}"
        )
        self.alert_type = alert_type
        self.allowed_types = tuple(allowed_types)


class MissingAlertHandlersError(AlertValidationError):
    def __init__(self, missing: Sequence[str], required: Sequence[str] = ALERT_TYPES_PRIORITY):
        super().__init__(
            "Script incompleto: faltam implementações/variáveis para: "
            f"{list(missing)}. Necessários: {list(required)}"
        )
        self.missing = tuple(missing)
        self.required = tuple(required)


@dataclass(frozen=True, slots=True)
class AlertEvent:
    timestamp: int
    alert_type: str
    src_cam: str
    bounding_box: BoundingBox  # ((x1,y1),(x2,y2))
    alert_confidence: float


def validate_alert_handlers(script_or_mapping: Any) -> None:
    """
    Valida se o 'script' possui implementações/variáveis para todos os tipos esperados.

    - Se for um dict-like, valida as chaves.
    - Caso contrário, valida atributos no objeto (ex.: módulo importado).
    """
    missing: list[str] = []

    if isinstance(script_or_mapping, Mapping):
        for t in ALERT_TYPES_PRIORITY:
            if t not in script_or_mapping:
                missing.append(t)
    else:
        for t in ALERT_TYPES_PRIORITY:
            if not hasattr(script_or_mapping, t):
                missing.append(t)

    if missing:
        raise MissingAlertHandlersError(missing)


def parse_alert_event(payload: str | bytes | Mapping[str, Any]) -> AlertEvent:
    """
    Converte/valida um payload (string JSON, bytes JSON ou dict) em um AlertEvent.

    Regras:
    - Campos obrigatórios: timestamp, alert_type, src_cam, bounding_box, alert_confidence
    - alert_type deve ser um dos tipos em ALERT_TYPES_PRIORITY
    - bounding_box deve ter 2 pontos, cada ponto (x,y) inteiro
    - alert_confidence deve estar entre 0 e 1
    """
    if isinstance(payload, (str, bytes)):
        try:
            data = json.loads(payload)
        except JSONDecodeError as e:
            raise InvalidAlertJSONError(f"JSON malformado: {e.msg}") from e
    elif isinstance(payload, Mapping):
        data = dict(payload)
    else:
        raise InvalidFieldTypeError("payload", "str|bytes|dict", type(payload).__name__)

    if not isinstance(data, dict):
        raise InvalidFieldTypeError("payload", "objeto JSON (dict)", type(data).__name__)

    required = ("timestamp", "alert_type", "src_cam", "bounding_box", "alert_confidence")
    missing_fields = [k for k in required if k not in data]
    if missing_fields:
        raise MissingRequiredFieldError(missing_fields, list(data.keys()))

    timestamp = _parse_timestamp(data["timestamp"])
    alert_type = _parse_alert_type(data["alert_type"])
    src_cam = _parse_src_cam(data["src_cam"])
    bbox = _parse_bounding_box(data["bounding_box"])
    conf = _parse_confidence(data["alert_confidence"])

    return AlertEvent(
        timestamp=timestamp,
        alert_type=alert_type,
        src_cam=src_cam,
        bounding_box=bbox,
        alert_confidence=conf,
    )


def parse_alert_event_or_none(
    payload: str | bytes | Mapping[str, Any],
    *,
    green_zone: BoundingBox | None = None,
) -> AlertEvent | None:
    """
    Regra acima de todas as outras:
    - Se o alerta estiver dentro da `green_zone`, ele é ignorado (retorna None).
    - Caso contrário, retorna o AlertEvent validado.

    `green_zone` usa o mesmo formato de bounding box: ((x1,y1),(x2,y2))
    """
    evt = parse_alert_event(payload)
    if green_zone is not None and is_bbox_inside(evt.bounding_box, green_zone):
        return None
    return evt


def sort_alert_events(events: Sequence[AlertEvent]) -> list[AlertEvent]:
    """Ordena eventos pela prioridade de ALERT_TYPES_PRIORITY e, depois, por timestamp (desc)."""
    priority_index = {t: i for i, t in enumerate(ALERT_TYPES_PRIORITY)}
    return sorted(
        list(events),
        key=lambda e: (priority_index.get(e.alert_type, 10_000), -e.timestamp),
    )


def is_bbox_inside(inner: BoundingBox, outer: BoundingBox) -> bool:
    """
    Retorna True se a bounding box `inner` estiver TOTALMENTE dentro da `outer`.

    Observação: normaliza coordenadas (aceita pontos invertidos).
    """
    il, it, ir, ib = _normalize_bbox(inner)
    ol, ot, or_, ob = _normalize_bbox(outer)
    return (ol <= il) and (ot <= it) and (ir <= or_) and (ib <= ob)


def _normalize_bbox(bbox: BoundingBox) -> tuple[int, int, int, int]:
    (x1, y1), (x2, y2) = bbox
    left = min(x1, x2)
    right = max(x1, x2)
    top = min(y1, y2)
    bottom = max(y1, y2)
    return left, top, right, bottom


def _parse_timestamp(value: Any) -> int:
    if isinstance(value, bool):
        raise InvalidFieldTypeError("timestamp", "int/str numérica", "bool")
    if isinstance(value, int):
        ts = value
    elif isinstance(value, str):
        v = value.strip()
        if not v.isdigit():
            raise InvalidFieldTypeError("timestamp", "str numérica (ex.: '1651347332')", "str")
        ts = int(v)
    else:
        raise InvalidFieldTypeError("timestamp", "int/str numérica", type(value).__name__)

    if ts <= 0:
        raise AlertValidationError("timestamp inválido: deve ser > 0.")
    return ts


def _parse_alert_type(value: Any) -> str:
    if not isinstance(value, str):
        raise InvalidFieldTypeError("alert_type", "str", type(value).__name__)
    t = value.strip()
    if t not in ALERT_TYPES_ALLOWED:
        raise InvalidAlertTypeError(t)
    return t


def _parse_src_cam(value: Any) -> str:
    if not isinstance(value, str):
        raise InvalidFieldTypeError("src_cam", "str", type(value).__name__)
    v = value.strip()
    if not v:
        raise AlertValidationError("src_cam inválido: não pode ser vazio.")
    return v


def _parse_bounding_box(value: Any) -> tuple[tuple[int, int], tuple[int, int]]:
    if not isinstance(value, (list, tuple)):
        raise InvalidFieldTypeError("bounding_box", "list/tuple com 2 pontos", type(value).__name__)
    if len(value) != 2:
        raise AlertValidationError("bounding_box inválido: esperado 2 pontos ((x1,y1),(x2,y2)).")

    p1 = _parse_point(value[0], field="bounding_box[0]")
    p2 = _parse_point(value[1], field="bounding_box[1]")
    return (p1, p2)


def _parse_point(value: Any, field: str) -> tuple[int, int]:
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        raise AlertValidationError(f"{field} inválido: esperado (x,y).")
    x, y = value
    if isinstance(x, bool) or isinstance(y, bool):
        raise AlertValidationError(f"{field} inválido: x/y devem ser inteiros (não bool).")
    if not isinstance(x, int) or not isinstance(y, int):
        raise AlertValidationError(f"{field} inválido: x/y devem ser inteiros.")
    return (x, y)


def _parse_confidence(value: Any) -> float:
    if isinstance(value, bool):
        raise InvalidFieldTypeError("alert_confidence", "float|int (0..1)", "bool")
    if isinstance(value, (int, float)):
        conf = float(value)
    else:
        raise InvalidFieldTypeError("alert_confidence", "float|int (0..1)", type(value).__name__)
    if not (0.0 <= conf <= 1.0):
        raise AlertValidationError("alert_confidence inválido: deve estar entre 0 e 1.")
    return conf

