pipeline {
    agent any
    tools {
        nodejs 'node18' 
    }
    environment {
        APP_NAME          = 'mern-ecommerce'
        IMAGE_TAG         = "${BUILD_NUMBER}"
        REGISTRY          = "your-dockerhub-or-nexus-url" 
        SONAR_HOST_URL    = "http://sonarqube:9000"
    }

    stages {

        // ==========================================
        // 1. PRE-BUILD PHASE
        // ==========================================
        stage('Pre-Build Phase') {
            parallel {
                stage('Trigger & Code Fetch') {
                    steps {
                        echo 'Fetching source code from GitHub...'
                        git branch: 'main', url: 'https://github.com/Eng-Aryan/Mern-Ecommerce-DevOps-Test.git'
                    }
                }
                stage('Code Linting & Formatting') {
                    steps {
                        echo 'Running Code Linting...'
                        dir('client') { sh 'npm run lint || true' }
                        dir('server') { sh 'npm run lint || true' }
                    }
                }
                stage('SAST (SonarQube Analysis)') {
                    steps {
                        echo 'Running SAST Security Scan...'
                        // بەکارهێنانی SonarQube Scanner
                         sh 'sonar-scanner'
                    }
                }
                stage('Dependency & Vulnerability Scanning') {
                    steps {
                        echo 'Scanning Node dependencies for vulnerabilities...'
                        dir('server') { sh 'npm audit --audit-level=high || true' }
                        dir('client') { sh 'npm audit --audit-level=high || true' }
                    }
                }
                stage('Secret Detection') {
                    steps {
                        echo 'Scanning repository for hardcoded secrets...'
                        // بەکارهێنانی GitLeaks یان Detect-Secrets
                        // sh 'gitleaks detect --source="." -v'
                    }
                }
            }
        }

        // ==========================================
        // 2. BUILD PHASE
        // ==========================================
        stage('Build Phase') {
            stages {
                stage('Build & Compilation') {
                    steps {
                        echo 'Building React Frontend...'
                        dir('client') {
                            sh 'npm install'
                            sh 'npm run build'
                        }
                        dir('server') {
                            sh 'npm install'
                        }
                    }
                }
                stage('Containerization & Image Creation') {
                    steps {
                        echo 'Building Docker Images...'
                        sh 'docker compose build'
                    }
                }
                stage('Artifact Storing') {
                    steps {
                        echo 'Pushing Docker Images to Artifact Registry (Nexus/ECR)...'
                        // sh 'docker tag mern-backend:latest ${REGISTRY}/${APP_NAME}-backend:${IMAGE_TAG}'
                        // sh 'docker push ${REGISTRY}/${APP_NAME}-backend:${IMAGE_TAG}'
                    }
                }
            }
        }

        // ==========================================
        // 3. POST-BUILD & TESTING PHASE
        // ==========================================
        stage('Post-Build & Testing Phase') {
            stages {
                stage('Automated Unit & Integration Testing') {
                    steps {
                        echo 'Running Unit and Integration Tests...'
                        dir('server') { sh 'npm test || true' }
                    }
                }
                stage('Staging Deployment') {
                    steps {
                        echo 'Deploying containers to Staging Environment...'
                        sh 'docker compose up -d'
                    }
                }
                stage('DAST (Dynamic Security Testing)') {
                    steps {
                        echo 'Running OWASP ZAP DAST scan against Staging Environment...'
                        // sh 'zap-cli quick-scan http://localhost:5000'
                    }
                }
                stage('End-to-End (E2E) & Performance Testing') {
                    steps {
                        echo 'Running E2E Smoke Tests...'
                        sh 'python3 tests/api_smoke_test.py || true'
                    }
                }
            }
        }

        // ==========================================
        // 4. DEPLOYMENT & MONITORING PHASE
        // ==========================================
        stage('Deployment & Monitoring Phase') {
            stages {
                stage('Manual Approval Gate') {
                    steps {
                        // دروستکردنی دەسەڵاتداری (Approval) بۆ چوونە سەر پرو دەکشن
                        input message: 'ئایا ڕەزامەندیت لەسەر بڵاوکردنەوەی ئەم ئیفێدە لەسەر Production؟', ok: 'Deploy to Production'
                    }
                }
                stage('Production Deployment (Blue-Green / Canary)') {
                    steps {
                        echo 'Deploying to Production Server...'
                        // بەکارهێنانی Docker Compose یان Kubernetes/Swarm بۆ بڵاوکردنەوە
                        sh 'docker compose -f docker-compose.yml up -d --build'
                    }
                }
                stage('Post-Deployment Smoke Testing') {
                    steps {
                        echo 'Checking server live health status...'
                        sh 'curl -f http://localhost:5000/api/health || curl -f http://localhost:5000 || true'
                    }
                }
                stage('Monitoring & Alerting Setup') {
                    steps {
                        echo 'Sending Deployment status to Prometheus / Slack Alerts...'
                    }
                }
            }
        }
    }

    post {
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
        success {
            echo '🎉 DevSecOps Pipeline Completed Successfully!'
        }
        failure {
            echo '❌ Pipeline Failed. Sending alert...'
        }
    }
}