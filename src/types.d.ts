declare namespace NodeJS {
  export interface ProcessEnv {
    GITHUB_ACTION: string;
    GITHUB_WORKSPACE: string;
  }
}
