---
layout: page
title: "GitHub Actions with non-root Docker user"
title_on_page: "GitHub Actions<br>with non-root Docker user"
code: true
excerpt: >
  Get rid of permission errors when using a non-root user in your Dockerfile during a GitHub Actions run.
---

The [GitHub Actions docs](https://docs.github.com/en/actions/reference/workflows-and-actions/dockerfile-support#user) tell us:

> Docker actions must be run by the default Docker user (root). Do not use the `USER` instruction in your `Dockerfile`, because you won't be able to access the `GITHUB_WORKSPACE` directory.

However, you may be reusing your Dockerfile for something else (e.g. a [Dev Container](https://containers.dev/)) where you certainly want to avoid running as root (for security reasons and for convenience). In this case, with a small workaround, it is still possible to run your GitHub Actions workflow as a non-root user without annoying permission errors.

First, make the user identifier (UID) and the group identifier (GID) an argument in your Dockerfile and set up the user as suggested in the [VSCode Dev Container docs](https://code.visualstudio.com/remote/advancedcontainers/add-nonroot-user#_creating-a-nonroot-user):

```docker
ARG USERNAME=any-username
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Create the user
RUN groupadd --gid $USER_GID $USERNAME \\
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \\
    #
    # [Optional] Add sudo support
    # Omit if you don't need to install software after connecting.
    && apt-get update \\
    && apt-get install -y sudo \\
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \\
    && chmod 0440 /etc/sudoers.d/$USERNAME

# ********************************************************
# * Anything else you want to do like clean up goes here *
# ********************************************************

# Set the default user to the non-root user created above
USER $USERNAME
```

However, the GitHub Actions VM will use its own dedicated `runner` user for your workflows. All we have to do is to pass its specific UID/GID during the build step of your container. This will make `any-username` have the same UID/GID as the GitHub Actions runner, therefore avoiding permission errors. In this example, I'm using [`docker buildx bake`](https://docs.docker.com/reference/cli/docker/buildx/bake/) to build the container (that I named `app` in the respective Docker Compose file):

```yml
steps:
  - name: Build and push docker image to GHCR
    run: >
      docker buildx bake
      --allow=fs.read=/home/runner/work/any-username/any-username
      -f ./compose.yml -f ../cicd/compose.cicd.build.yml
      --set app.args.USER_UID=$(id -u)
      --set app.args.USER_GID=$(id -g)
```

Note the `--set` flags here: we pass the output of `id -u` and `id -g` to the arguments `USER_ID` and `USER_GID` (used in the Dockerfile) respectively.
