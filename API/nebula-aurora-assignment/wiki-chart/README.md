# Wiki Chart - Helm Chart

Helm chart to deploy the complete Wikipedia-like API system with FastAPI, PostgreSQL, Prometheus, and Grafana.

## Components

- **FastAPI**: Main API service
- **PostgreSQL**: Database
- **Prometheus**: Metrics collection
- **Grafana**: Metrics visualization

## Installation

```bash
# Install the chart
helm install wiki-release ./wiki-chart

# Or with custom values
helm install wiki-release ./wiki-chart -f custom-values.yaml
```

## Configuration

Main values can be configured in `values.yaml`:

- `fastapi.image_name`: FastAPI Docker image name (default: `wiki-service`)
- `fastapi.image_tag`: Image tag (default: `latest`)
- `postgresql.*`: PostgreSQL configuration
- `prometheus.*`: Prometheus configuration
- `grafana.*`: Grafana configuration

## Endpoints Exposed via Ingress

- `/users/*` - Routes to FastAPI service (user creation and query)
- `/posts/*` - Routes to FastAPI service (post creation and query)
- `/grafana/d/creation-dashboard-678/creation` - Grafana dashboard showing the rate of user and post creation

## Resources

The chart is configured to use at most:
- **CPU**: 2 cores
- **RAM**: 4GB
- **Disk**: 5GB

## Uninstallation

```bash
helm uninstall wiki-release
```
