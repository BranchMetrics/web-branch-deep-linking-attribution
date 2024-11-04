{
  description = "NodeJS 16_x project";

  inputs = {
    # Specify the source of Home Manager and Nixpkgs.
    branch-nix.url = "git+ssh://git@github.com/BranchMetrics/nix";
  };

  outputs = { self, branch-nix }:
    let
      nixpkgs = branch-nix.nixpkgs;
      nixpkgs-unstable = branch-nix.nixpkgs-unstable;
      extra-pkgs = branch-nix.packages;
      utils = branch-nix.utils;
      system-utils = branch-nix.system-utils;
    in
    utils.lib.eachDefaultSystem (system:
      let
        stable-pkgs = nixpkgs.legacyPackages.${system};
        unstable-pkgs = nixpkgs.legacyPackages.${system};
        pkgs = stable-pkgs // {
          extra-pkgs = extra-pkgs.${system};
          unstable = unstable-pkgs;
        };
        bazel-os = system-utils.getBazelOs system;
        nodejs = pkgs.extra-pkgs.nodejs-16_x;
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
