# Setting Up Local LLMs in Docker for Todo-GPT

This guide will walk you through how to run your own local Large Language Model (LLM) inside a Docker container and configure it as the processing engine for Todo-GPT.

By running local LLMs, you can avoid API costs and keep your codebase analysis and generation completely offline and private.

---

## Option 1: Running Ollama (Recommended)

Ollama is extremely fast, lightweight, and supports an OpenAI-compatible API out of the box.

### 1. Start the Ollama Container

Run the following command in your terminal to start Ollama with CPU support:

```bash
docker run -d -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

*(Optional)* If you have an **Nvidia GPU** and want hardware acceleration, make sure you have the Nvidia Container Toolkit installed, then run:

```bash
docker run -d --gpus=all -v ollama:/root/.ollama -p 11434:11434 --name ollama ollama/ollama
```

### 2. Download and Run a Model

Run a model (such as `llama3`, `mistral`, or `codellama`) inside the container:

```bash
docker exec -it ollama ollama run llama3
```

This will download the model weights (typically ~4.7 GB for 8B models) and start a terminal chat session. You can exit the session using `/exit`, and the model will remain loaded in memory, ready for API calls.

---

## Option 2: Running LocalAI

LocalAI is a full drop-in replacement for OpenAI API, supporting audio transcription, image generation, and text models.

### 1. Start the LocalAI Container

Start the LocalAI container on port `8080`:

```bash
docker run -p 8080:8080 --name local-ai -ti localai/localai:latest-cpu
```

### 2. Install a Model

Once LocalAI is running, you can install models through its Web UI or CLI. For example, to download a LLaMA-based model:

```bash
docker exec -it local-ai local-ai-cli models install llama-3-8b-instruct
```

---

## Option 3: Running vLLM (For High-Performance GPUs)

vLLM is a high-throughput, easy-to-use LLM serving engine.

```bash
docker run --gpus all \
    -v ~/.cache/huggingface:/root/.cache/huggingface \
    -p 8000:8000 \
    --ipc=host \
    vllm/vllm-openai:latest \
    --model meta-llama/Meta-Llama-3-8B-Instruct
```

---

## Hooking Up to Todo-GPT Settings

Once your local LLM docker container is running, configure Todo-GPT to connect to it:

1. Start your Todo-GPT server (`npm start` or double-click the Electron desktop app).
2. Open `http://localhost:3000` in your web browser.
3. Click the **⚙️ Settings** button inside the *Integrations* card on the right side.
4. Set the **Default AI Model** dropdown to `Local LLaMA 3 (Custom Docker)`.
5. Under the **Custom Docker LLM (OpenAI-compatible)** section, enter the details:
   - **Base URL:**
     - For **Ollama:** `http://localhost:11434/v1`
     - For **LocalAI:** `http://localhost:8080/v1`
     - For **vLLM:** `http://localhost:8000/v1`
   - **Model Name:**
     - Enter the exact name of the model you downloaded (e.g. `llama3`, `mistral`, `llama-3-8b-instruct`).
   - **API Key:** Leave empty or type any placeholder (e.g., `ollama` or `localai`).
6. Click **Save Settings**.

Now, when you schedule tasks or speak to the Todo-GPT visual orb using the `Local LLaMA 3` option, all requests will route straight to your local Docker container!
