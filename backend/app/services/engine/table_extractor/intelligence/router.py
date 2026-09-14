"""
Convertly V2 — Dynamic Engine Router
Directs PDF pages to optimal extraction engines based on document intelligence
profiling, topology, scan status, and volume thresholds.
"""

from typing import Optional, Dict
from ..constants import DocumentType, TableTopology, EngineType
from ..models import DocumentProfile, RoutingDecision
from ..interfaces import BaseRouter
from ..config import TableExtractorConfig


class EngineRouter(BaseRouter):
    """
    Evaluates DocumentProfile to produce a precise RoutingDecision with primary engine,
    fallback engine, per-page engine routes, and streaming mode triggers.
    """

    def route(
        self,
        profile: DocumentProfile,
        config: Optional[TableExtractorConfig] = None
    ) -> RoutingDecision:
        """
        Synthesizes profile metrics into an actionable RoutingDecision.
        """
        cfg = config or TableExtractorConfig()
        streaming_mode = profile.total_pages >= cfg.memory.streaming_page_threshold

        page_routes: Dict[int, str] = {}
        ocr_required = False

        # Build per-page routes first
        for p in profile.page_profiles:
            idx = p["page_idx"]
            if p.get("is_scanned", False):
                page_routes[idx] = EngineType.OCR_TSV.value
                ocr_required = True
            elif p.get("topology") == TableTopology.LATTICE.value or p.get("topology") == TableTopology.NESTED.value:
                page_routes[idx] = EngineType.LATTICE.value
            elif p.get("topology") == TableTopology.SEMI_BORDERED.value:
                page_routes[idx] = EngineType.HYBRID.value
            else:
                page_routes[idx] = EngineType.STREAM.value

        # Determine document-level primary and fallback engine
        if profile.doc_type == DocumentType.SCANNED.value:
            primary = EngineType.OCR_TSV.value
            fallback = EngineType.STREAM.value
            reason = "Pure scanned/raster document detected. Routed to OCR TSV engine with deskew."
            complexity = "high"
            ocr_required = True

        elif profile.doc_type == DocumentType.MIXED.value:
            primary = EngineType.HYBRID.value
            fallback = EngineType.OCR_TSV.value
            reason = "Mixed native and scanned pages detected. Routed to Hybrid engine with OCR fallback."
            complexity = "high"
            ocr_required = True

        else:
            # Native text PDF
            if profile.has_ruling_lines:
                # Check dominant topology among page profiles
                topologies = [p.get("topology") for p in profile.page_profiles]
                lattice_count = sum(1 for t in topologies if t in (TableTopology.LATTICE.value, TableTopology.NESTED.value))
                semi_count = sum(1 for t in topologies if t == TableTopology.SEMI_BORDERED.value)

                if lattice_count >= semi_count:
                    primary = EngineType.LATTICE.value
                    fallback = EngineType.STREAM.value
                    reason = "Bordered grid rulings detected. Routed to Lattice vector mesh engine."
                    complexity = "low" if not profile.has_mixed_layouts else "medium"
                else:
                    primary = EngineType.HYBRID.value
                    fallback = EngineType.STREAM.value
                    reason = "Semi-bordered horizontal ruling lines detected. Routed to Hybrid line-stream engine."
                    complexity = "medium"
            else:
                # Borderless stream
                primary = EngineType.STREAM.value
                fallback = EngineType.HYBRID.value
                reason = "Borderless table structure detected. Routed to X/Y whitespace projection stream engine."
                complexity = "medium"

        return RoutingDecision(
            primary_engine=primary,
            fallback_engine=fallback,
            reason=reason,
            estimated_complexity=complexity,
            ocr_required=ocr_required,
            streaming_mode=streaming_mode,
            page_routes=page_routes,
        )
