FROM docker:dind

# Install necessary tools
RUN apk add --no-cache \
    bash \
    curl \
    wget \
    git \
    python3 \
    py3-pip \
    kubectl \
    helm \
    jq \
    sudo \
    openrc

# Install k3d
RUN wget -q -O - https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash

# Set working directory
WORKDIR /workspace

# Copy wiki-service and wiki-chart
COPY wiki-service ./wiki-service
COPY wiki-chart ./wiki-chart

# Copy setup script
COPY setup-cluster.sh ./setup-cluster.sh
RUN chmod +x ./setup-cluster.sh

# Expose port 8080
EXPOSE 8080

# Start script
ENTRYPOINT ["/workspace/setup-cluster.sh"]
