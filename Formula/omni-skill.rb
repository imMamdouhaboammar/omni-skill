class OmniSkill < Formula
  desc "Universal Cross-Host Agent Skill Engineering Engine & Compiler"
  homepage "https://github.com/imMamdouhaboammar/omni-skill"
  url "https://github.com/imMamdouhaboammar/omni-skill/archive/refs/tags/v5.0.0.tar.gz"
  sha256 "5a503a82b71cc3169612c3cf2537e0a82776a384b02a04dd3af83096bc7a6a7c" # placeholder, updated on release
  license "MIT"
  head "https://github.com/imMamdouhaboammar/omni-skill.git", branch: "main"

  depends_on "bun" => :recommended
  depends_on "node" => :optional
  depends_on "python@3.12" => :recommended

  def install
    if which("bun")
      system "bun", "install", "--frozen-lockfile" rescue system "bun", "install"
      system "bun", "run", "--filter", "@omni-skill/cli", "build"
    else
      system "npm", "install"
      system "npm", "run", "build", "--workspaces"
    end

    libexec.install Dir["*"]
    bin.install_symlink libexec/"packages/cli/dist/index.js" => "omni-skill"
  end

  test do
    assert_match "Universal Cross-Host Agent Skill Engine & Compiler", shell_output("#{bin}/omni-skill --help")
  end
end
