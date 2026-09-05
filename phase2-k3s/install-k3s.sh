#!/bin/bash
# Script d'installation K3s avec options de securite

set -e

echo "Installation de K3s..."
curl -sfL https://get.k3s.io | INSTALL_K3S_EXEC="\
  --disable traefik \
  --disable servicelb \
  --kube-apiserver-arg=anonymous-auth=false \
  --secrets-encryption" sh -

echo "Configuration de kubectl..."
mkdir -p ~/.kube
sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config
sudo chown devops:devops ~/.kube/config
chmod 600 ~/.kube/config
echo 'export KUBECONFIG=~/.kube/config' >> ~/.bashrc
source ~/.bashrc

echo "K3s installe avec succes"
kubectl get nodes