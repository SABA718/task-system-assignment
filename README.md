# AI Task Processing Platform

A full-stack, distributed AI task processing platform built with the MERN stack, Python, Redis, and Kubernetes, managed via GitOps/Argo CD.

## Features
- **User Authentication**: JWT-based login and registration with bcrypt hashing[cite: 1].
- **Asynchronous Processing**: Python worker service utilizes a Redis queue to process tasks (Uppercase, Lowercase, Reverse, Word Count)[cite: 1].
- **Infrastructure**: Fully containerized with multi-stage Docker builds and deployed on Kubernetes[cite: 1].
- **GitOps**: Automated deployment using Argo CD and CI/CD pipelines via GitHub Actions[cite: 1].

## Prerequisites
- Kubernetes Cluster (e.g., k3s, minikube)
- Argo CD installed
- Docker & Docker Hub account

## Getting Started
1. **Clone the repository**: `git clone <your-repo-url>`
2. **Environment Setup**: Set up your MongoDB and Redis instances.
3. **Deploy to Kubernetes**:
   - Apply manifests from the infrastructure directory: `kubectl apply -f k8s/`
4. **Access the Application**:
   - Access the frontend via port-forwarding: `kubectl port-forward svc/frontend-service 5173:5173 -n task-system`[cite: 1].

## CI/CD & GitOps
- **CI/CD**: GitHub Actions automatically lints, builds Docker images, and pushes them to the registry[cite: 1].
- **GitOps**: Argo CD monitors the infrastructure repository for manifest changes and performs automated synchronization[cite: 1].

## Architecture
- **Worker Scaling**: Uses Kubernetes Horizontal Pod Autoscaler (HPA) to scale Python workers based on Redis queue depth[cite: 1].
- **High Volume**: Optimized for high task volume via efficient database indexing and task decoupling[cite: 1].
