"""
Conversation State Management
対話状態管理モジュール
"""
from enum import Enum


class ConversationState(Enum):
    """対話状態の定義"""
    INITIAL = "initial"  # 初期状態（ノートブック未選択）
    NOTEBOOK_SELECTED = "notebook_selected"  # ノートブック選択済み
    READY_TO_SEARCH = "ready_to_search"  # 検索実行可能（将来の拡張用）
