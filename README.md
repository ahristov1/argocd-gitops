<h1>GitOps project</h1>
<h2>All the steps that are performed in order to make this project</h2>

<h3>Step 1</h3>
First of all install Docker Deskotp for Mac (otherwise it won't work).
The URL for the installation: https://docs.docker.com/desktop/setup/install/mac-install/

<h3>Step 2</h3>
Install minikube with homebrew.
URL: https://minikube.sigs.k8s.io/docs/start/?arch=%2Fmacos%2Farm64%2Fstable%2Fhomebrew

<h3>Step 3</h3>
Install ArgoCD, followed the documentation from the official website.
URL: https://argo-cd.readthedocs.io/en/stable/getting_started/
A port forward has to be created in order for the UI to be accessible, the command used for that is kubectl port-forward svc/argocd-server -n argocd 8080:443. The URL for the UI is http://localhost:8080
For CLI login this command is used: argocd login localhost:8080 --username admin --password <password> --insecure

<h3>Step 4</h3>
Created a github repository for the code to be pushed there, this acts as a source of truth and ArgoCD tracks if any changes are made, if they are, then it will synchronize the updates and deploy immedietly.

<h3>Step 5</h3>
Create the project structure:
<img width="1182" height="434" alt="image" src="https://github.com/user-attachments/assets/b5b3a767-076b-48d3-8f9d-e1fff32187cf" />
<br>
The app/ directory contains the index.html, style.css and script.js files as also a Dockerfile.
<br>
<img width="946" height="434" alt="image" src="https://github.com/user-attachments/assets/7d5d6031-6c6d-400e-a545-46221bffce12" />
<br>
It uses light weight nginx (alpine), copies the files to the nginx destination directory, exposes port 80 and starts the process in foregound mode. <br>
In the kustomize directory it contains the kustomization.yaml, the deployment.yaml and service.yaml files. <br>
The kustomization.yaml file is for customizing k8s configuration. <br>
The deployment.yaml file is for creating the pod - in the current configuration it creates only 1 replica/pod. <br>
The service.yaml is for exposing the service of the pod itself. In this case the exposed port is 80. <br>

<h3>Step 6</h3>
Create Github Actions pipeline in the UI.
GitHub Actions workflow explained:
<ol>
  <li>Trigger: Runs on push to main branch when app/ files change</li>
  <li>Checkout: Gets the code from repository</li>
  <li>QEMU Setup: Enables multi-architecture builds (AMD64 + ARM64)</li>
  <li>Docker Buildx: Advanced Docker build engine</li>
  <li>Docker Hub Login: Authenticates to push images</li>
  <li>Build & Push: Creates Docker image for both architectures and pushes to Docker Hub</li>
  <li>Update Manifest: Changes the image tag in deployment.yaml to the new commit SHA</li>
  <li>Commit & Push: Commits the manifest change back to the repository</li>
</ol>

<h3>Step 7</h3>
Configure Github secrets and Github Actions permissions. <br>
For the secrets they are configured in Settings -> Secrets and variables -> Actions. DOCKER_USERNAME is the docker hub username and DOCKER_PASSWORD is docker hub password in order to access the image from the account in docker hub. <br>
Github Actions is configured in Settings -> Actions -> General, allows Github Actions to create and approve pull requests.

<h3>Step 8</h3>
Create ArgoCD Application:
<br>
<br>
<b>CLI:</b>
<br>
argocd app create nginx-app \ <br>
  --repo https://github.com/YOUR_USERNAME/argocd-gitops.git \ <br>
  --path kustomize \ <br>
  --dest-server https://kubernetes.default.svc/ \ <br>
  --dest-namespace default \ <br>
  --sync-policy automated \ <br>
  --auto-prune \ <br>
  --self-heal <br>
  <br>
  <b>Explanation of parameters:</b>
  <br>
  <ul>
    <li>--sync-policy automated - automatically sync when changes detected</li>
    <li>--auto-prune - delete resources that are no longer in Git</li>
    <li>--self-heal - revert manual changes to match Git state</li>
    <li>--path kustomize - where to find the k8s manifests in repo</li>
  </ul>
<br>
<b>UI</b>
<ol>
  <li>NEW APP</li>
  <li>Application Name: nginx-app</li>
  <li>Project: default</li>
  <li>Sync Policy: Automatic (enable prune and self-heal)</li>
  <li>Repository URL: https://github.com/ahristov1/argocd-gitops.git</li>
  <li>Revision: HEAD</li>
  <li>Path: kustomize</li>
  <li>Cluster URL: https://kubernetes.default.svc</li>
  <li>Namesoace: default</li>
</ol>
<h2>Adding monitoring to the project</h2>
Additionally I added monitoring in order to track/monitor resources.
<br>
The first step is to install helm. Helm is a package manager for k8s, it makes it easier to install all the components for Prometheus Grafana. Helm packages everything in to one chart and makes it like a single package for installation.
<br>
<img width="2734" height="434" alt="image" src="https://github.com/user-attachments/assets/cc768ff8-6b67-4f5f-8872-d0237d1033b7" />
<br>
After that add the Prometheus community charts repo to helm:
<br>
helm repo add prometheus-community https://prometheus-community.gith
<br>
helm repo update - this will refresh the available repositories/packages.
<br>
Created a new namespace in order for everything to be organized:
<br>
<br>
kubectl create namespace monitoring
<br>
<br>
helm install prometheus prometheus-community/kube-prometheus-stack \ <br>
--namespace monitoring \ <br>
--set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false <br>
<br>
The second command will:
<ul>
  <li>install prometheus</li>
  <li>specify which chart to use (in this case its prometheus-community/kube-prometheus-stack)</li>
  <li>install in monitoring namespace</li>
  <li>allow Prometheus to discover all ServiceMonitors, not just ones with labels</li>
</ul>
<h3>Adding ServiceMonitor for the application</h3>
A ServiceMonitor is a custom resource in Prometheus that defines how a k8s service should be monitored. The custom resource is added by the Prometheus Operator. It tells Prometheus to scan metrics from the specified service. ServiceMonitor creates the connection between Prometheus and the application that we want to monitor.
<br>
<img width="1086" height="612" alt="image" src="https://github.com/user-attachments/assets/5f5e878e-6e16-44af-baef-c063d5222e7f" />
<br>
<ul>
  <li>kind: ServiceMonitor - type of k8s resource (referenced from the API)</li>
  <li>namespace: default - place the pod in the same namespace as the nginx service</li>
  <li>selector.matchLabels.app: nginx - which service to monitor (matches nginx-service)</li>
  <li>endpoints.port: http - which port to scrape (in the service its also named http)</li>
  <li>interval: 30s - scrape metrics every 30 seconds</li>
</ul>
<br>
From there the only thing that needs to be done is to create custom dashboards and set monitoring alarms.
<br>
For this demo the only dashboard that works and has alarm is CPU % usage dashboard.
