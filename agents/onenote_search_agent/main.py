"""
OneNote Search Agent - A2A Protocol Compatible
Main entry point using official A2A SDK
"""
import uvicorn
from a2a.server.apps import A2AStarletteApplication
from a2a.server.request_handlers import DefaultRequestHandler
from a2a.server.tasks import InMemoryTaskStore
from a2a.types import (
    AgentCapabilities,
    AgentCard,
    AgentSkill,
)
from core.executor import OneNoteSearchAgentExecutor


if __name__ == '__main__':
    # Define notebook listing skill
    list_notebooks_skill = AgentSkill(
        id='list_notebooks',
        name='ノートブック一覧取得',
        description='利用可能なOneNoteノートブックの一覧を取得します',
        tags=['ノートブック', '一覧', 'onenote'],
        examples=[
            'ノートブック一覧を表示して',
            '利用可能なノートブックを教えて',
            'どのノートブックがありますか？',
        ],
    )

    # Define search skill
    search_skill = AgentSkill(
        id='search_onenote',
        name='OneNote検索',
        description='指定されたOneNoteノートブック内から関連情報を検索します（ノートブック選択後に使用）',
        tags=['検索', '情報検索', 'onenote'],
        examples=[
            '先週のミーティングノートを探して',
            'プロジェクト仕様書を検索',
            'Q4の計画書を探して',
        ],
    )

    # Define Q&A skill
    qa_skill = AgentSkill(
        id='answer_question',
        name='質問回答',
        description='選択されたノートブックの内容から質問に回答します',
        tags=['質問', '回答', 'Q&A', 'onenote'],
        examples=[
            'プロジェクトの納期について教えて',
            '前回のミーティングでの決定事項は？',
            'このタスクの担当者は誰ですか？',
        ],
    )

    # Define summarization skill
    summarize_skill = AgentSkill(
        id='summarize_content',
        name='コンテンツ要約',
        description='選択されたノートブックの内容を要約します',
        tags=['要約', 'まとめ', 'onenote'],
        examples=[
            '今月のミーティング内容を要約して',
            'プロジェクトの進捗をまとめて',
            '重要なポイントを抽出して',
        ],
    )

    # Define content extraction skill
    extract_skill = AgentSkill(
        id='extract_content',
        name='OneNoteコンテンツ抽出',
        description='特定のOneNoteページからコンテンツを抽出します',
        tags=['抽出', 'コンテンツ', 'onenote'],
        examples=[
            "「Q1計画」というタイトルのページからコンテンツを抽出して",
            '昨日のミーティングノートを取得',
            'プロジェクトキックオフノートを表示',
        ],
    )

    # Create public agent card
    public_agent_card = AgentCard(
        name='OneNote検索エージェント',
        description='MCPを使用してMicrosoft OneNoteノートブックから情報を検索・取得するAIエージェント（対話型マルチステップ）',
        url='http://onenote-search-agent:8000',
        version='0.2.0',
        default_input_modes=['text'],
        default_output_modes=['text'],
        capabilities=AgentCapabilities(
            streaming=False,
            push_notifications=False,
            state_transition_history=True,  # 対話状態管理を有効化
        ),
        skills=[
            list_notebooks_skill,
            search_skill,
            qa_skill,
            summarize_skill,
            extract_skill,
        ],
    )

    # Create request handler with our executor
    request_handler = DefaultRequestHandler(
        agent_executor=OneNoteSearchAgentExecutor(),
        task_store=InMemoryTaskStore(),
    )

    # Create A2A Starlette application
    server = A2AStarletteApplication(
        agent_card=public_agent_card,
        http_handler=request_handler,
    )

    # Run the server
    # reload=True enables hot reload for development
    uvicorn.run(
        server.build(),
        host='0.0.0.0',
        port=8000,
        reload=True,
        reload_dirs=['/app']  # Watch /app directory for changes in Docker
    )
