{
  description = "web-branch-deep-linking-attribution flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-25.11";
    utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        nodejs = pkgs.nodejs_24;
      in
      {
        devShell = pkgs.mkShell {
          nativeBuildInputs = [
            nodejs
          ];
          shellHook = ''
            if [ -f $HOME/.config/bin/setup-webstorm-sdk ] && [ -f ./.idea/workspace.xml ]; then
              $HOME/.config/bin/setup-webstorm-sdk || echo "setup-webstorm-sdk failed"
            fi
          '';
        };
        formatter = pkgs.nixpkgs-fmt;
      }
    );
}
