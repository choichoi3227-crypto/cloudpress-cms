// src/lib/wp-bridge/github-fs.ts
import { Octokit } from "@octokit/rest";

export class GitHubFS {
  private octokit: Octokit;
  constructor(private token: string, private owner: string, private repo: string) {
    this.octokit = new Octokit({ auth: token });
  }

  async getFile(path: string) {
    const { data } = await this.octokit.repos.getContent({
      owner: this.owner,
      repo: this.repo,
      path,
    });
    return Buffer.from((data as any).content, 'base64').toString();
  }

  async saveFile(path: string, content: string, message: string) {
    // SHA 확인 후 업데이트 또는 생성 로직 (생략)
    await this.octokit.repos.createOrUpdateFileContents({
      owner: this.owner,
      repo: this.repo,
      path,
      message,
      content: Buffer.from(content).toString('base64'),
    });
  }
}
