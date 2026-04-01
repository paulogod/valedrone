#!/bin/bash
set -e

echo "=== Starting Docker daemon ==="
dockerd &
sleep 5
until docker info > /dev/null 2>&1; do
    echo "Waiting for Docker daemon..."
    sleep 1
done
echo "Docker daemon is running"

echo "=== Building wiki-service Docker image ==="
cd /workspace/wiki-service
docker build -t wiki-service:latest .

echo "=== Creating k3d cluster ==="
k3d cluster create wiki-cluster \
    --port "8080:80@loadbalancer" \
    --wait \
    --timeout 300s \
    --k3s-arg "--disable=traefik@server:0"

echo "=== Waiting for cluster to be ready ==="
kubectl wait --for=condition=ready node --all --timeout=300s

echo "=== Loading wiki-service image into k3d ==="
k3d image import wiki-service:latest -c wiki-cluster

echo "=== Installing nginx ingress controller ==="
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/main/deploy/static/provider/kind/deploy.yaml

echo "=== Waiting for ingress controller to be ready ==="
kubectl wait --namespace ingress-nginx \
    --for=condition=ready pod \
    --selector=app.kubernetes.io/component=controller \
    --timeout=300s

echo "=== Installing wiki-chart with Helm ==="
cd /workspace/wiki-chart
helm install wiki-release . \
    --set fastapi.image_name=wiki-service \
    --set fastapi.image_tag=latest \
    --set ingress.enabled=true \
    --set ingress.className=nginx

echo "=== Waiting for all pods to be ready ==="
echo "Waiting for FastAPI..."
kubectl wait --for=condition=ready pod \
    -l app.kubernetes.io/component=fastapi \
    --timeout=300s || true

echo "Waiting for PostgreSQL..."
kubectl wait --for=condition=ready pod \
    -l app.kubernetes.io/component=postgres \
    --timeout=300s || true

echo "Waiting for Prometheus..."
kubectl wait --for=condition=ready pod \
    -l app.kubernetes.io/component=prometheus \
    --timeout=300s || true

echo "Waiting for Grafana..."
kubectl wait --for=condition=ready pod \
    -l app.kubernetes.io/component=grafana \
    --timeout=300s || true

echo "=== Cluster is ready! ==="
echo "Endpoints available at:"
echo "  - http://localhost:8080/users/*"
echo "  - http://localhost:8080/posts/*"
echo "  - http://localhost:8080/grafana/d/creation-dashboard-678/creation"
echo ""
echo "=== Cluster Status ==="
kubectl get pods -A
echo ""
echo "=== Ingress Status ==="
kubectl get ingress -A
echo ""
echo "=== Keeping container alive ==="
tail -f /dev/null
