pipeline {
    agent any

    environment {
        DOCKER_BUILDKIT = '1'

        // ── Credentials IDs ─────────────────────────────────────────────────
        VM_SSH_CRED_ID    = "dinesh-tex-ssh"             // Jenkins credential ID for VM SSH key
        GITHUB_CRED_ID    = "github-cred"            // Jenkins credential ID for GitHub
        DOCKERHUB_CRED_ID = "dockerhub-creds"             // Jenkins credential ID for Docker Hub
        ENV_CRED_ID       = "dinesh-tex-env"       // Jenkins credential ID for Secret File (.env)

        // ── Docker Image Names ──────────────────────────────────────────────
        // [REQUIRED] Always present
        BACKEND_IMAGE  = "casdevops/dinesh-tex-backend"
        FRONTEND_IMAGE = "casdevops/dinesh-tex-frontend"

        // ── VM Deployment Target ────────────────────────────────────────────
        VM_USER    = "cubeai"                            // your-vm-username
        VM_HOST    = "192.168.1.42"                     // your.vm.ip.address
        VM_APP_DIR = "/home/cubeai/dinesh-tex-deploy"    // /home/your-vm-username/your-project-name

        // ── Git Configuration ───────────────────────────────────────────────
        GIT_BRANCH = "deploy"                              // change branch if needed
        GIT_URL    = "https://github.com/cubeaisolutionstech/dinesh-tex.git"

        // ── Source Directories (match your repo folder names) ───────────────
        // [REQUIRED]
        BACKEND_DIR  = "backend"
        FRONTEND_DIR = "frontend"
    }

    options {
        timestamps()
        timeout(time: 30, unit: 'MINUTES')
    }

    stages {

        // ── 1. Verify SSH to VM ─────────────────────────────────────────────
        stage('🔌 Verify VM SSH Connection') {
            steps {
                echo '🔌 Testing SSH connection to VM...'
                withCredentials([sshUserPrivateKey(
                    credentialsId: "${VM_SSH_CRED_ID}",
                    keyFileVariable: 'SSH_KEY'
                )]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no -o ConnectTimeout=20 -i $SSH_KEY \
                            ${VM_USER}@${VM_HOST} 'echo "SSH OK — $(hostname)"'
                    '''
                }
            }
        }

        // ── 2. Checkout Source Code ─────────────────────────────────────────
        stage('📥 Checkout Code') {
            steps {
                echo '📥 Fetching source code...'
                git branch: "${GIT_BRANCH}",
                    url: "${GIT_URL}",
                    credentialsId: "${GITHUB_CRED_ID}"
            }
        }

        // ── 3. Build & Push Backend ─────────────────────────────────────────
        stage('🐳 Build & Push Backend Image') {
            steps {
                echo '🐳 Building backend Docker image...'
                dir("${BACKEND_DIR}") {
                    sh "docker build --no-cache -t ${BACKEND_IMAGE}:latest ."
                }
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CRED_ID}",
                    usernameVariable: 'DOCKERHUB_USER',
                    passwordVariable: 'DOCKERHUB_PASSWORD'
                )]) {
                    sh """
                        echo \$DOCKERHUB_PASSWORD | docker login -u \$DOCKERHUB_USER --password-stdin
                        docker push ${BACKEND_IMAGE}:latest
                    """
                }
            }
        }

        // ── 4. Build & Push Frontend ────────────────────────────────────────
        stage('🐳 Build & Push Frontend Image') {
            steps {
                echo '🐳 Building frontend Docker image...'
                dir("${FRONTEND_DIR}") {
                    sh "docker build --no-cache -t ${FRONTEND_IMAGE}:latest ."
                }
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKERHUB_CRED_ID}",
                    usernameVariable: 'DOCKERHUB_USER',
                    passwordVariable: 'DOCKERHUB_PASSWORD'
                )]) {
                    sh """
                        echo \$DOCKERHUB_PASSWORD | docker login -u \$DOCKERHUB_USER --password-stdin
                        docker push ${FRONTEND_IMAGE}:latest
                    """
                }
            }
        }

        // ── 5. Sync Files to VM ─────────────────────────────────────────────
        stage('📂 Copy Config to VM') {
            steps {
                echo '📂 Copying project files to VM...'
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: "${VM_SSH_CRED_ID}",
                        keyFileVariable: 'SSH_KEY'
                    ),
                    file(
                        credentialsId: "${ENV_CRED_ID}",
                        variable: 'ENV_FILE'
                    )
                ]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no -i $SSH_KEY \
                            ${VM_USER}@${VM_HOST} "mkdir -p ${VM_APP_DIR}"

                        # Syncing only the deploy configurations
                        rsync -avz --delete \
                            --exclude="docker-compose.override.yml" \
                            -e "ssh -o StrictHostKeyChecking=no -i $SSH_KEY" \
                            deploy/ ${VM_USER}@${VM_HOST}:${VM_APP_DIR}/
                        
                        # Securely copy the Secret File to the VM as .env
                        scp -o StrictHostKeyChecking=no -i $SSH_KEY \
                            $ENV_FILE ${VM_USER}@${VM_HOST}:${VM_APP_DIR}/.env
                    '''
                }
            }
        }

        // ── 6. Pull Images & Deploy on VM ───────────────────────────────────
        stage('🚀 Deploy to VM') {
            steps {
                echo '🚀 Deploying application on VM...'
                withCredentials([
                    sshUserPrivateKey(
                        credentialsId: "${VM_SSH_CRED_ID}",
                        keyFileVariable: 'SSH_KEY'
                    ),
                    usernamePassword(
                        credentialsId: "${DOCKERHUB_CRED_ID}",
                        usernameVariable: 'DOCKERHUB_USER',
                        passwordVariable: 'DOCKERHUB_PASSWORD'
                    )
                ]) {
                    sh '''
                        ssh -o StrictHostKeyChecking=no -i $SSH_KEY $VM_USER@$VM_HOST "
                            echo '$DOCKERHUB_PASSWORD' | docker login -u '$DOCKERHUB_USER' --password-stdin &&

                            docker pull $BACKEND_IMAGE:latest &&
                            docker pull $FRONTEND_IMAGE:latest &&

                            cd $VM_APP_DIR &&
                            (docker compose down || docker-compose down) &&
                            
                            # Ensure required variables are set for compose down/up
                            export BACKEND_IMAGE=$BACKEND_IMAGE &&
                            export FRONTEND_IMAGE=$FRONTEND_IMAGE &&
                            
                            (docker compose up -d --force-recreate || docker-compose up -d --force-recreate) &&
                            docker image prune -af --filter 'until=12h' &&
                            docker ps
                        "
                    '''
                }
            }
        }
    }

    post {
        always {
            echo '🧹 Cleaning up Jenkins workspace...'
            cleanWs()
        }
        success { echo 'Deployment successful! 🎉' }
        failure { echo 'Deployment failed! ❌' }
    }
}
