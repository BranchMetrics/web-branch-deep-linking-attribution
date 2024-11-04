{
  description = "web-branch-deep-linking-attribution flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-24.05";
    utils.url = "github:numtide/flake-utils";
  };

  # each key in the inputs becomes the named argument of the the function below
  outputs = { self, nixpkgs, utils }:
    utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};
        # the oldest nodejs sdk version we can use with public nixpkgs is 18.x
        # This should be find for our web-sdk
        nodejs = pkgs.nodejs_18;
      in
      {
        formatter = pkgs.nixpkgs-fmt;
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
      }
    );
}
