"""
OneNote Search Agent Executor
A2A protocol compliant agent executor implementation
"""
from a2a.server.agent_execution import AgentExecutor, RequestContext
from a2a.server.events import EventQueue
from a2a.utils import new_agent_text_message

from .conversation_state import ConversationState
from .onenote_agent import OneNoteSearchAgent


class OneNoteSearchAgentExecutor(AgentExecutor):
    """OneNote Search Agent Executor - A2A protocol compliant implementation"""

    def __init__(self):
        self.agent = OneNoteSearchAgent()

    async def execute(
        self,
        context: RequestContext,
        event_queue: EventQueue,
    ) -> None:
        """
        Execute OneNote search based on user input with multi-step conversation

        Args:
            context: Request context containing user input and metadata
            event_queue: Queue for enqueueing response events
        """
        # Get the user's input and task ID from the context
        user_input = context.input_text or ""
        task_id = getattr(context, 'task_id', 'default')

        # 現在の対話状態を取得
        current_state = self.agent.conversation_states.get(task_id, ConversationState.INITIAL)

        # 状態に応じた処理フロー
        result = await self._handle_state(task_id, current_state, user_input)

        # ノートブック選択の処理（番号または名前での選択）
        if current_state == ConversationState.INITIAL and task_id in self.agent.conversation_states:
            selection_result = await self._handle_notebook_selection(task_id, user_input)
            if selection_result:
                result = selection_result

        # Enqueue the result as a text message event
        await event_queue.enqueue_event(new_agent_text_message(result))

    async def _handle_state(self, task_id: str, current_state: ConversationState, user_input: str) -> str:
        """
        状態に応じた処理を実行

        Args:
            task_id: タスクID
            current_state: 現在の対話状態
            user_input: ユーザー入力

        Returns:
            処理結果メッセージ
        """
        if current_state == ConversationState.INITIAL:
            # Step 1: ノートブック一覧を取得するか、直接検索かを判定
            if any(keyword in user_input.lower() for keyword in ['ノートブック', 'notebook', '一覧', 'list']):
                # ノートブック一覧を表示
                result = await self.agent.list_notebooks()
                self.agent.conversation_states[task_id] = ConversationState.INITIAL
            else:
                # まず対話を開始してノートブックを選択させる
                result = "OneNote検索を開始します。\n\n"
                result += await self.agent.list_notebooks()
                self.agent.conversation_states[task_id] = ConversationState.INITIAL
            return result

        elif current_state == ConversationState.NOTEBOOK_SELECTED:
            # Step 2: ノートブック選択済み -> 検索、質問、要約を実行
            return await self._handle_notebook_operations(task_id, user_input)

        else:
            # 未知の状態 -> リセット
            result = "エラー: 不明な状態です。最初からやり直してください。\n\n"
            result += await self.agent.list_notebooks()
            self.agent.conversation_states[task_id] = ConversationState.INITIAL
            return result

    async def _handle_notebook_operations(self, task_id: str, user_input: str) -> str:
        """
        ノートブック選択後の操作を処理

        Args:
            task_id: タスクID
            user_input: ユーザー入力

        Returns:
            処理結果メッセージ
        """
        notebook_id = self.agent.selected_notebooks.get(task_id, "unknown")

        if any(keyword in user_input.lower() for keyword in ['質問', '回答', '教えて', '?', '?']):
            # 質問に回答
            result = await self.agent.answer_question(notebook_id, user_input)
        elif any(keyword in user_input.lower() for keyword in ['要約', 'まとめ', 'summary']):
            # 要約
            result = await self.agent.summarize_content(notebook_id, user_input)
        elif any(keyword in user_input.lower() for keyword in ['抽出', 'extract', 'コンテンツ']):
            # コンテンツ抽出
            result = await self.agent.extract_content(user_input)
        else:
            # デフォルトは検索
            result = await self.agent.search_in_notebook(notebook_id, user_input)

        # 検索後もノートブック選択状態を維持
        self.agent.conversation_states[task_id] = ConversationState.NOTEBOOK_SELECTED
        return result

    async def _handle_notebook_selection(self, task_id: str, user_input: str) -> str:
        """
        ノートブック選択処理

        Args:
            task_id: タスクID
            user_input: ユーザー入力

        Returns:
            選択完了メッセージ（選択されなかった場合は空文字列）
        """
        # 番号選択の検出（1, 2, 3, 4など）
        if user_input.strip().isdigit():
            nb_index = int(user_input.strip()) - 1
            mock_notebooks = self.agent.get_mock_notebooks()

            if 0 <= nb_index < len(mock_notebooks):
                selected = mock_notebooks[nb_index]
                self.agent.selected_notebooks[task_id] = selected['id']
                self.agent.conversation_states[task_id] = ConversationState.NOTEBOOK_SELECTED
                return f"✅ ノートブック「{selected['name']}」を選択しました。\n\n検索キーワードを入力するか、以下の操作を指定してください:\n- 検索: キーワードを入力\n- 質問: 「〜について教えて」\n- 要約: 「要約して」"

        # 名前での選択の検出
        elif any(nb_name in user_input for nb_name in ['個人用ノート', 'プロジェクトA', 'ミーティング議事録', '技術メモ']):
            for nb in self.agent.get_mock_notebooks():
                if nb['name'] in user_input:
                    self.agent.selected_notebooks[task_id] = nb['id']
                    self.agent.conversation_states[task_id] = ConversationState.NOTEBOOK_SELECTED
                    return f"✅ ノートブック「{nb['name']}」を選択しました。\n\n検索キーワードを入力するか、以下の操作を指定してください:\n- 検索: キーワードを入力\n- 質問: 「〜について教えて」\n- 要約: 「要約して」"

        return ""

    async def cancel(
        self, context: RequestContext, event_queue: EventQueue
    ) -> None:
        """
        Cancel ongoing execution

        Args:
            context: Request context
            event_queue: Event queue for cancellation messages
        """
        task_id = getattr(context, 'task_id', 'default')

        # 状態をクリア
        if task_id in self.agent.conversation_states:
            del self.agent.conversation_states[task_id]
        if task_id in self.agent.selected_notebooks:
            del self.agent.selected_notebooks[task_id]

        await event_queue.enqueue_event(
            new_agent_text_message("OneNote検索操作をキャンセルしました。")
        )
