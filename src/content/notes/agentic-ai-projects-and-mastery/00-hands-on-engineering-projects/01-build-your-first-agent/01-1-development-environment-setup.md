---
title: "1.1 Setting Up the Development Environment"
description: "Python project setup, virtual environments, and installing the OpenAI SDK, LangChain, and LangGraph so the rest of the book's code samples run without friction."
tags: ["agentic-ai-projects-and-mastery", "hands-on-engineering-projects", "book"]
hidden: false
zettelId: "202607151031-2"
---

## Setting Up the Development Environment

**User Story 1.1** | Covers: Python, venv, package installation, project structure, credentials,
smoke test

### What you will have at the end

- A Python virtual environment with Anthropic SDK, LangChain, and LangGraph installed
- A project folder structure you will reuse for every lab
- A working smoke-test agent that calls Claude and prints a response

---

### Prerequisites

You need Python 3.12 or higher. Check your version:

```bash
python3 --version
```

Expected output: `Python 3.12.x` or higher. If you see an older version, install Python 3.12+ from
[python.org](https://python.org) before continuing.

---

### Step 1 — Create the project folder

If you are starting from a fresh Git clone, the folder already exists. Move into it:

```bash
cd shipsolid--agentic-ai-foundations
```

If you are starting from scratch (no repo yet):

```bash
mkdir shipsolid--agentic-ai-foundations
cd shipsolid--agentic-ai-foundations
git init
```

---

### Step 2 — Create a virtual environment

A virtual environment keeps this project's packages isolated from your system Python. You only do
this once per project.

```bash
python3 -m venv .venv
```

This creates a `.venv/` folder inside the project. You never edit files inside it manually.

**Activate the environment** (you must do this every time you open a new terminal):

```bash
# macOS / Linux
source .venv/bin/activate

# Windows (Command Prompt)
.venv\Scripts\activate.bat

# Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

Your terminal prompt should change to show `(.venv)` at the front — that tells you the environment
is active.

---

### Step 3 — Install the required packages

With the venv active, install all four libraries:

```bash
pip install anthropic langchain langgraph langchain-anthropic python-dotenv
```

What each package does:

| Package               | Purpose                                                  |
| --------------------- | -------------------------------------------------------- |
| `anthropic`           | Official Anthropic Python SDK — sends requests to Claude |
| `langchain`           | Framework for chaining LLM calls, prompts, and tools     |
| `langgraph`           | Builds stateful, graph-based multi-agent workflows       |
| `langchain-anthropic` | LangChain's connector to Claude models                   |
| `python-dotenv`       | Loads `.env` files into environment variables            |

Once the install finishes, pin the exact versions so your project is reproducible:

```bash
pip freeze > requirements.txt
```

> **Why pin versions?** LLM libraries change quickly. Pinning means someone else (or future-you) can
> recreate the exact same environment with `pip install -r requirements.txt`.

#### Alternatives in the market

These are the other tools you will encounter — good to know they exist even if you are not using
them yet.

**LLM SDKs** (alternatives to `anthropic`)

| Package           | Provider  | Notes                                  |
| ----------------- | --------- | -------------------------------------- |
| `openai`          | OpenAI    | GPT-4o, o1, o3 models                  |
| `google-genai`    | Google    | Gemini models                          |
| `boto3` (Bedrock) | AWS       | Access multiple models via AWS         |
| `mistralai`       | Mistral   | Open-weight models, EU-hosted          |
| `ollama`          | Community | Run models locally — no API key needed |

**Agent / Orchestration frameworks** (alternatives to `langchain` + `langgraph`)

| Package                    | Style                     | Notes                                       |
| -------------------------- | ------------------------- | ------------------------------------------- |
| `llama-index`              | RAG-first                 | Better for document-heavy agents            |
| `autogen` (Microsoft)      | Multi-agent conversations | Agents that talk to each other              |
| `crewai`                   | Role-based agents         | "Crew" of specialised agents with roles     |
| `pydantic-ai`              | Type-safe, Pythonic       | Built by the Pydantic team — very clean API |
| `smolagents` (HuggingFace) | Minimal                   | Lightweight, code-first agents              |
| `openai Agents SDK`        | OpenAI-native             | OpenAI's own framework, released 2025       |

**Env / config** (alternatives to `python-dotenv`)

| Package              | Notes                                                               |
| -------------------- | ------------------------------------------------------------------- |
| `pydantic-settings`  | Typed settings with validation — production-grade                   |
| OS env vars directly | `export ANTHROPIC_API_KEY=...` — no package needed for simple cases |

##### Why we chose what we chose for this course

- `anthropic` — official SDK for Claude; clean Python API, well-maintained by Anthropic
- `langchain` + `langgraph` — widest adoption in production, most learning material available
- `python-dotenv` — simplest credential loading for local dev

As you progress, `pydantic-ai` and `crewai` are worth experimenting with — they represent a newer,
cleaner generation of frameworks compared to LangChain.

---

### Step 4 — Create the project structure

Create the folders:

```bash
mkdir -p src labs/01_hello_agent tests
```

Create empty `__init__.py` files so Python treats these as packages:

```bash
touch src/__init__.py
touch labs/01_hello_agent/__init__.py
```

Your structure should look like this:

```text
shipsolid--agentic-ai-foundations/
├── .venv/               ← virtual environment (never commit this)
├── labs/
│   └── 01_hello_agent/
│       └── hello_agent.py
├── src/                 ← shared code will go here in later labs
├── tests/
│   └── test_hello_agent.py
├── .env                 ← your credentials (never commit this)
├── .env.example         ← template committed to Git
├── .gitignore
└── requirements.txt
```

---

### Step 5 — Configure credentials

Copy the example file:

```bash
cp .env.example .env
```

Open `.env` and replace the placeholder with your real key:

```text
ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
```

**Where to get a key:** [console.anthropic.com/keys](https://console.anthropic.com/keys)

> **Important:** `.env` is listed in `.gitignore`. It will never be committed. Never paste your API
> key into source code directly — always load it from environment variables.

---

### Step 6 — Create the `.gitignore`

This tells Git to ignore files that should not be committed:

```bash
cat > .gitignore << 'EOF'
.venv/
__pycache__/
*.pyc
*.pyo
.env
.DS_Store
*.egg-info/
dist/
.pytest_cache/
EOF
```

---

### Step 7 — Write the smoke-test agent

Create `labs/01_hello_agent/hello_agent.py`:

```python
"""
Lab 01 — Hello Agent
Smoke test: calls Claude (Anthropic SDK) and prints the response.
Run: python labs/01_hello_agent/hello_agent.py
"""

import os
from dotenv import load_dotenv
import anthropic

load_dotenv()


def run_hello_agent(prompt: str = "What is an AI agent in one sentence?") -> str:
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        raise EnvironmentError(
            "ANTHROPIC_API_KEY not set. Copy .env.example to .env and fill it in."
        )

    client = anthropic.Anthropic(api_key=api_key)

    response = client.messages.create(
        model="claude-haiku-4-5",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}],
    )

    return response.content[0].text


if __name__ == "__main__":
    answer = run_hello_agent()
    print(f"Agent response:\n{answer}")
```

**Walk through the code:**

| Line                               | What it does                                                    |
| ---------------------------------- | --------------------------------------------------------------- |
| `load_dotenv()`                    | Reads `.env` and loads `ANTHROPIC_API_KEY` into `os.environ`    |
| `os.getenv("ANTHROPIC_API_KEY")`   | Reads the key — raises an error with a clear message if missing |
| `anthropic.Anthropic(api_key=...)` | Creates the client that talks to Anthropic's API                |
| `client.messages.create(...)`      | Sends a message to Claude and returns a response                |
| `response.content[0].text`         | Extracts the text from the first content block in the response  |

> **Model choice:** We use `claude-haiku-4-5` here — it is Anthropic's fastest and cheapest model,
> ideal for smoke tests and learning labs. For production agents that need more reasoning depth,
> swap to `claude-sonnet-4-6` or `claude-opus-4-8`.

---

### Step 8 — Run the agent

With your venv active and `.env` populated:

```bash
python labs/01_hello_agent/hello_agent.py
```

Expected output (wording will vary):

```text
Agent response:
An AI agent is an autonomous system that perceives its environment, reasons about it, and takes actions to achieve a goal.
```

If you see that — your environment is working end to end.

---

### Step 9 — Run the tests

Install pytest first:

```bash
pip install pytest
pip freeze > requirements.txt   # re-pin to include pytest
```

Run the tests:

_python -m pytest_ — runs pytest as a module via Python's own interpreter. This ensures pytest uses
the same Python (and the same .venv) you're currently in, rather than a globally installed pytest
that might point to a different environment.

_tests/_ — tells pytest to discover and run all test files inside the tests/ directory (any file
matching test\_\*.py).

_-v_ — verbose mode. Without it you just get dots (.) for passes and F for failures. With it you see
each test function by name plus PASSED / FAILED, which is much easier to read when learning.

```bash
python -m pytest tests/ -v
```

Expected output:

```text
tests/test_hello_agent.py::test_run_hello_agent_returns_string PASSED
tests/test_hello_agent.py::test_run_hello_agent_raises_without_api_key PASSED

2 passed in 0.24s
```

The tests use mocks — they do not call Anthropic or consume any API credits.

---

### Step 10 — Commit to Git

Stage everything except ignored files and make the initial commit:

```bash
git add .
git commit -m "feat: scaffold local agent dev environment (User Story 1.1)"
```

Verify nothing sensitive was included:

```bash
git show --stat HEAD
```

You should see `.gitignore`, `requirements.txt`, the `labs/` files, and `tests/` — but **not**
`.env` or `.venv/`.

---

### Troubleshooting

| Problem                                       | Fix                                                                     |
| --------------------------------------------- | ----------------------------------------------------------------------- |
| `command not found: python3`                  | Install Python 3.12+ from python.org                                    |
| `(.venv)` not showing in prompt               | Run `source .venv/bin/activate` again                                   |
| `EnvironmentError: ANTHROPIC_API_KEY not set` | Check `.env` exists and the key is pasted correctly                     |
| `AuthenticationError` from Anthropic          | Key is invalid or expired — generate a new one at console.anthropic.com |
| `ModuleNotFoundError: anthropic`              | Venv is not active — run `source .venv/bin/activate`                    |

---

### What you built

```text
[Your .env]  →  load_dotenv()  →  Anthropic client  →  claude-haiku-4-5  →  text response
```

This is the simplest possible agent: one input, one LLM call, one output. Every more complex agent
in this course adds on top of this foundation.

**Next:** User Story 1.2 — you will build your first tool-using agent.

## Metadata

|        |                                 |
| ------ | ------------------------------- |
| Author | Amit Singh                      |
| Scope  | agentic-ai-projects-and-mastery |
