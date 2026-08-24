#!/usr/bin/env bash
set -e

# OmniSkill Universal Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/imMamdouhaboammar/omni-skill/main/install.sh | bash

RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}"
echo "  ___                  _ ____  _     _ _ _ "
echo " / _ \ _ __ ___  _ __ (_) ___|| | __(_) | |"
echo "| | | | '_ \` _ \| '_ \| \___ \| |/ /| | | |"
echo "| |_| | | | | | | | | | |___) |   < | | | |"
echo " \___/|_| |_| |_|_| |_|_|____/|_|\_\|_|_|_|"
echo -e "${NC}"
echo -e "${BOLD}Universal Cross-Host Agent Skill Engine & Compiler${NC}\n"

INSTALL_DIR="${HOME}/.omni-skill"
BIN_DIR="${INSTALL_DIR}/bin"

mkdir -p "${BIN_DIR}"

echo -e "${CYAN}==>${NC} Installing OmniSkill to ${INSTALL_DIR}..."

# Check if bun is available, if not install it
if ! command -v bun &> /dev/null; then
    echo -e "${CYAN}==>${NC} Bun not found. Installing Bun runtime..."
    curl -fsSL https://bun.sh/install | bash
    export PATH="${HOME}/.bun/bin:${PATH}"
fi

# Clone or update repository
if [ -d "${INSTALL_DIR}/repo" ]; then
    echo -e "${CYAN}==>${NC} Updating existing OmniSkill installation..."
    cd "${INSTALL_DIR}/repo" && git pull --quiet origin main
else
    echo -e "${CYAN}==>${NC} Cloning OmniSkill repository..."
    git clone --quiet https://github.com/imMamdouhaboammar/omni-skill.git "${INSTALL_DIR}/repo"
    cd "${INSTALL_DIR}/repo"
fi

echo -e "${CYAN}==>${NC} Installing dependencies and building CLI..."
cd "${INSTALL_DIR}/repo"
bun install --frozen-lockfile 2>/dev/null || bun install
bun run --filter "@omni-skill/cli" build

# Create wrapper binary in bin dir
cat << 'WRAPPER' > "${BIN_DIR}/omni-skill"
#!/usr/bin/env bash
exec bun "${HOME}/.omni-skill/repo/packages/cli/dist/index.js" "$@"
WRAPPER
chmod +x "${BIN_DIR}/omni-skill"

# Add to PATH in shell rc files
SHELL_CONFIG=""
if [ -n "$ZSH_VERSION" ] || [ "$SHELL" = "/bin/zsh" ]; then
    SHELL_CONFIG="${HOME}/.zshrc"
elif [ -n "$BASH_VERSION" ] || [ "$SHELL" = "/bin/bash" ]; then
    SHELL_CONFIG="${HOME}/.bashrc"
fi

if [ -n "${SHELL_CONFIG}" ] && [ -f "${SHELL_CONFIG}" ]; then
    if ! grep -q ".omni-skill/bin" "${SHELL_CONFIG}"; then
        echo -e "\n# OmniSkill CLI" >> "${SHELL_CONFIG}"
        echo 'export PATH="${HOME}/.omni-skill/bin:${PATH}"' >> "${SHELL_CONFIG}"
        echo -e "${GREEN}==>${NC} Added OmniSkill to PATH in ${SHELL_CONFIG}"
    fi
fi

export PATH="${BIN_DIR}:${PATH}"

echo -e "\n${GREEN}${BOLD}✔ OmniSkill successfully installed!${NC}"
echo -e "Run ${CYAN}omni-skill --help${NC} or restart your terminal to begin."
