import asyncio
from typing import Annotated

import typer
from common.commands import create_menus, create_user

app = typer.Typer()


@app.command()
def add_user(
    username: Annotated[str, typer.Argument(help="用户名")],
    password: Annotated[str, typer.Option(prompt=True, confirmation_prompt=True, hide_input=True)],  # 隐藏式密码输入
) -> None:
    """创建新用户"""
    asyncio.run(create_user(username, password))


@app.command()
def init_menus() -> None:
    asyncio.run(create_menus())


if __name__ == "__main__":
    app()
