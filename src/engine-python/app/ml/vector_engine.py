"""
=============================================================================
SITEMAP INTELLIGENCE AGENT - SEMANTIC VECTOR ENGINE
Location: src/engine-python/app/ml/vector_engine.py
Purpose: Generates 384-dimensional dense semantic embeddings using
         all-MiniLM-L6-v2 via ONNX runtime for sub-millisecond inference.
=============================================================================
"""
from fastembed import TextEmbedding


class SemanticVectorEngine:
    """
    Manages lightweight, CPU-optimized sentence embeddings.
    Zero PyTorch dependency; uses all-MiniLM-L6-v2 ONNX runtime.
    """
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.model = TextEmbedding(model_name=model_name)

    def generate_embedding(self, text: str) -> list[float] | None:
        """
        Transforms clean webpage textual corpus into a normalized 384-dimensional vector.
        """
        clean_input = text.strip()
        if not clean_input or len(clean_input) < 20:
            return None

        # Truncate overly long pages to first 512 tokens for dense representation
        embeddings = list(self.model.embed([clean_input[:2000]]))
        if embeddings:
            return embeddings[0].tolist()
        return None