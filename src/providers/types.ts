export interface ProviderRequest {
  model: string;
  input: string;
}

export interface ProviderResult {
  text: string;
}

export interface AIProvider {
  readonly name: string;
  stream(request: ProviderRequest): AsyncGenerator<string, void, void>;
  complete(request: ProviderRequest): Promise<ProviderResult>;
}
