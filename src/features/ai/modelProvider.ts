// ModelProvider 抽象层 + OpenAI 兼容实现
// 对应 SPEC §2 横切：多模型接入层

/** 模型提供商配置 */
export interface ProviderConfig {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
  /** 是否为 OpenAI 兼容 API */
  isOpenAICompatible: boolean;
}

/** LLM 消息 */
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

/** LLM 请求选项 */
export interface ChatOptions {
  maxTokens?: number;
  temperature?: number;
}

/** LLM 响应 */
export interface ChatResponse {
  content: string;
  /** token 用量（用于展示给用户参考） */
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
  /** 原始响应 JSON（调试用） */
  raw?: string;
}

/** 统一 LLM 接入接口 */
export interface IModelProvider {
  /** 发送对话请求 */
  chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse>;
  /** 流式对话（预留） */
  chatStream?(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncGenerator<string, void, unknown>;
}

/** OpenAI 兼容客户端实现 */
export class OpenAICompatibleProvider implements IModelProvider {
  constructor(private config: ProviderConfig) {}

  async chat(messages: ChatMessage[], options?: ChatOptions): Promise<ChatResponse> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    const body: Record<string, unknown> = {
      model: this.config.model,
      messages,
    };
    if (options?.maxTokens !== undefined) {
      body["max_tokens"] = options.maxTokens;
    }
    if (options?.temperature !== undefined) {
      body["temperature"] = options.temperature;
    }

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `模型请求失败 (${response.status}): ${errorText}`,
      );
    }

    const data = await response.json();

    return {
      content: data.choices?.[0]?.message?.content ?? "",
      usage: data.usage
        ? {
            promptTokens: data.usage.prompt_tokens ?? 0,
            completionTokens: data.usage.completion_tokens ?? 0,
          }
        : undefined,
      raw: JSON.stringify(data),
    };
  }

  async *chatStream(
    messages: ChatMessage[],
    options?: ChatOptions,
  ): AsyncGenerator<string, void, unknown> {
    // 流式实现预留
    const result = await this.chat(messages, options);
    yield result.content;
  }
}

/** 根据配置创建 provider 实例 */
export function createProvider(config: ProviderConfig): IModelProvider {
  if (config.isOpenAICompatible) {
    return new OpenAICompatibleProvider(config);
  }
  // 后续可扩展其他非 OpenAI 兼容的 provider
  throw new Error(`不支持的 provider 类型: ${config.name}`);
}

/** 默认的 provider 配置模板（不含真实 Key） */
export const providerTemplates: ProviderConfig[] = [
  {
    id: "openai",
    name: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    apiKey: "",
    model: "gpt-4o-mini",
    isOpenAICompatible: true,
  },
  {
    id: "deepseek",
    name: "DeepSeek",
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: "",
    model: "deepseek-chat",
    isOpenAICompatible: true,
  },
  {
    id: "qwen",
    name: "通义千问 (百炼)",
    baseUrl: "https://dashscope.aliyuncs.com/compatible-mode/v1",
    apiKey: "",
    model: "qwen-turbo",
    isOpenAICompatible: true,
  },
  {
    id: "moonshot",
    name: "Moonshot",
    baseUrl: "https://api.moonshot.cn/v1",
    apiKey: "",
    model: "moonshot-v1-8k",
    isOpenAICompatible: true,
  },
];