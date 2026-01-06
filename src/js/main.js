import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';

// --- 상수 설정 ---
const LANE_WIDTH = 4.0; 
const GAME_SPEED = 0.4; 

// --- 1. 씬 설정 ---
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.015);
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(0, 7, 12); 
camera.rotation.x = -0.4;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// --- 2. 조명 설정 ---
const ambientLight = new THREE.AmbientLight(0x404040, 2); 
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(0, 20, 10);
dirLight.castShadow = true;
scene.add(dirLight);

// --- 3. 포스트 프로세싱 ---
const renderScene = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = 0.1;
bloomPass.strength = 1.2; 
bloomPass.radius = 0.5;
const composer = new EffectComposer(renderer);
composer.addPass(renderScene);
composer.addPass(bloomPass);


// --- 4. 레인 시스템 ---
const laneMeshes = [];

function createLanes() {
    const geometry = new THREE.PlaneGeometry(LANE_WIDTH - 0.2, 400); 
    const lanePositions = [-LANE_WIDTH, 0, LANE_WIDTH];

    lanePositions.forEach((x, index) => {
        const material = new THREE.MeshStandardMaterial({
            color: 0x1a1a1a,
            roughness: 0.5,
            metalness: 0.8,
            emissive: 0x000000, 
            emissiveIntensity: 1.0
        });
        const lane = new THREE.Mesh(geometry, material);
        lane.rotation.x = -Math.PI / 2;
        lane.position.set(x, 0, -100); 
        lane.receiveShadow = true;
        scene.add(lane);
        laneMeshes.push(lane);

        const helperGeo = new THREE.PlaneGeometry(0.05, 400);
        const helperMat = new THREE.MeshBasicMaterial({ color: 0x333333, transparent: true, opacity: 0.5 });
        const helper = new THREE.Mesh(helperGeo, helperMat);
        helper.rotation.x = -Math.PI / 2;
        helper.position.set(x, 0.01, -100);
        scene.add(helper);
    });
}
createLanes();

// 배경 반응형 네온 도형들
const neonShapes = [];
function createNeonBackground() {
    const geo1 = new THREE.TorusGeometry(3, 0.2, 16, 50);
    const mat1 = new THREE.MeshBasicMaterial({ color: 0xff00ff, wireframe: true, transparent: true, opacity: 0.3 });
    const geo2 = new THREE.BoxGeometry(4, 4, 4);
    const mat2 = new THREE.MeshBasicMaterial({ color: 0x00ffff, wireframe: true, transparent: true, opacity: 0.3 });
    const geo3 = new THREE.IcosahedronGeometry(3);
    const mat3 = new THREE.MeshBasicMaterial({ color: 0xffff00, wireframe: true, transparent: true, opacity: 0.3 });

    for(let i=0; i<15; i++) {
        let mesh;
        const rand = Math.random();
        if(rand < 0.33) mesh = new THREE.Mesh(geo1, mat1);
        else if(rand < 0.66) mesh = new THREE.Mesh(geo2, mat2);
        else mesh = new THREE.Mesh(geo3, mat3);

        mesh.position.set(
            (Math.random() - 0.5) * 150, 
            (Math.random()) * 50 + 10,   
            -Math.random() * 200 - 50    
        );
        mesh.rotation.set(Math.random()*Math.PI, Math.random()*Math.PI, 0);
        
        scene.add(mesh);
        neonShapes.push(mesh);
    }
}
createNeonBackground();

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.5 });
    const starVertices = [];
    for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 400;
        const y = (Math.random() - 0.5) * 400;
        const z = (Math.random() - 0.5) * 400;
        starVertices.push(x, y, z);
    }
    starGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starVertices, 3));
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}
createStars();


// ==========================================
// 🚀 에셋 로딩
// ==========================================
let player = null;
let obstacleModel = null;

const loadingScreen = document.getElementById('loading-screen');
const loadingBar = document.getElementById('loading-bar');
const loadingStatus = document.getElementById('loading-status');
const uiLayer = document.getElementById('ui-layer');

const manager = new THREE.LoadingManager();

manager.onLoad = function () {
    loadingBar.style.width = '100%';
    loadingStatus.innerText = 'SYSTEM ONLINE.';
    setTimeout(() => {
        loadingScreen.style.opacity = '0';
        setTimeout(() => {
            loadingScreen.style.display = 'none';
            uiLayer.style.display = 'flex';
        }, 500);
    }, 500);
};

manager.onProgress = function (url, itemsLoaded, itemsTotal) {
    const progress = (itemsLoaded / itemsTotal) * 100;
    loadingBar.style.width = progress + '%';
};

const loader = new GLTFLoader(manager);

function centerModel(object) {
    const box = new THREE.Box3().setFromObject(object);
    const center = box.getCenter(new THREE.Vector3());
    object.traverse(child => {
        if (child.isMesh) {
            child.position.x -= center.x;
        }
    });
}

loader.load('kenney_space-kit/Models/GLTF format/craft_speederA.glb', (gltf) => {
    player = gltf.scene;
    centerModel(player);
    player.position.set(0, 0.3, 0); 
    player.rotation.y = Math.PI;
    player.traverse(c => { if(c.isMesh) { c.castShadow=true; c.receiveShadow=true; } });
    scene.add(player);
});

loader.load('kenney_space-kit/Models/GLTF format/meteor_detailed.glb', (gltf) => {
    obstacleModel = gltf.scene;
    centerModel(obstacleModel);
    obstacleModel.scale.set(1.5, 1.5, 1.5);
    obstacleModel.traverse(c => {
        if(c.isMesh) {
            c.castShadow = true;
            c.material.color.setHex(0x888888);
            c.material.emissive = new THREE.Color(0x220000);
        }
    });
});


// --- 5. 게임 로직 ---
let playerLaneIndex = 1; 
let isPlaying = false;
let score = 0;
let obstacles = [];
let lastBeatTime = 0;
let spawnHistory = []; 

// [NEW] 비트 감지 및 카메라 쉐이크 변수
let averageBass = 0; 
let cameraShakeY = 0;

let audioContext, analyser, dataArray, source;
const instruction = document.getElementById('instruction');
const scoreBoard = document.getElementById('score-board');

// 조작 함수
function moveLeft() {
    if (!player || !isPlaying) return;
    if(playerLaneIndex > 0) playerLaneIndex--;
}

function moveRight() {
    if (!player || !isPlaying) return;
    if(playerLaneIndex < 2) playerLaneIndex++;
}

// 키보드 조작
window.addEventListener('keydown', (e) => {
    if (e.code === 'ArrowLeft') moveLeft();
    else if (e.code === 'ArrowRight') moveRight();
});

// 터치 조작
const btnLeft = document.getElementById('btn-left');
const btnRight = document.getElementById('btn-right');

if (btnLeft && btnRight) {
    btnLeft.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        moveLeft(); 
    }, { passive: false });
    
    btnRight.addEventListener('touchstart', (e) => { 
        e.preventDefault(); 
        moveRight(); 
    }, { passive: false });
    
    // PC 마우스 테스트용
    btnLeft.addEventListener('mousedown', () => moveLeft());
    btnRight.addEventListener('mousedown', () => moveRight());
}

// 모바일 안내 문구 변경
if (window.innerWidth <= 768) {
    const guideText = document.querySelector('#instruction p:last-child');
    if(guideText) guideText.innerText = '조작: 화면 좌측 / 우측 터치';
}

// 드래그 앤 드롭
window.addEventListener('dragover', (e) => e.preventDefault());
window.addEventListener('drop', (e) => {
    e.preventDefault();
    if (player && obstacleModel && e.dataTransfer.files[0]) startGame(e.dataTransfer.files[0]);
});

// 파일 선택 버튼
const fileInput = document.getElementById('file-input');
const touchControls = document.getElementById('touch-controls');

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    // [CRITICAL] iOS/Mobile 정책 대응: 사용자 제스처(change 이벤트) 내에서 즉시 AudioContext 생성
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    const ctx = new AudioContextClass();
    
    // 모델이 아직 로드되지 않았다면 경고 (보통 로딩 화면 때문에 이럴 일은 드묾)
    if (!player || !obstacleModel) {
        alert("Resources not ready yet. Please wait.");
        return;
    }

    // "DECODING..." 피드백 표시
    const originalText = instruction.innerHTML;
    instruction.innerHTML = `<h1>PROCESSING...</h1><div style="color:#0ff">DECODING AUDIO DATA</div>`;
    
    // 같은 파일 다시 선택 가능하도록 초기화
    e.target.value = '';

    startGame(file, ctx);
}

if(fileInput) {
    fileInput.addEventListener('change', handleFileSelect);
}

function startGame(file, ctx) {
    // startGame에서는 UI 숨김 처리를 비동기 완료 후로 미루거나, 
    // 여기서 바로 숨기지 않고 setupAudio 완료 후 숨깁니다.
    // 하지만 "Processing"을 보여주기 위해 유지합니다.

    score = 0;
    scoreBoard.innerText = "SCORE: 0";
    isPlaying = true;
    obstacles.forEach(obj => scene.remove(obj));
    obstacles = [];
    playerLaneIndex = 1; 
    spawnHistory = [];
    averageBass = 0;
    
    // 기존 오디오 정리
    if (source) {
        try { source.stop(); } catch(e){}
        source = null;
    }
    
    // 오디오 컨텍스트 설정
    audioContext = ctx;
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 512;
    dataArray = new Uint8Array(analyser.frequencyBinCount);

    const reader = new FileReader();
    reader.readAsArrayBuffer(file);
    reader.onload = (e) => {
        audioContext.decodeAudioData(e.target.result, (decodedData) => {
            // 디코딩 완료 시 게임 시작
            instruction.parentElement.style.display = 'none';
            if(touchControls) touchControls.style.display = 'flex';

            source = audioContext.createBufferSource();
            source.buffer = decodedData;
            source.connect(analyser);
            analyser.connect(audioContext.destination);
            source.start(0);
            source.onended = gameOver;
        }, (err) => {
            alert("Audio decode failed: " + err.message);
            instruction.innerHTML = originalText; // 에러 시 복구는 복잡하므로 간단히 새로고침 권장 메시지 등
            location.reload(); 
        });
    };
}

// setupAudio 함수는 startGame으로 통합되었으므로 제거하거나 남겨두되 사용하지 않음
function setupAudio(buffer) { /* Deprecated */ }



function spawnObstacle() {
    if (!obstacleModel) return;

    let laneIdx = Math.floor(Math.random() * 3);
    if (spawnHistory.length >= 2) {
        const last = spawnHistory[spawnHistory.length - 1];
        const secondLast = spawnHistory[spawnHistory.length - 2];
        if (last !== secondLast) {
            const remainingLane = 3 - (last + secondLast);
            if (laneIdx === remainingLane) {
                laneIdx = Math.random() < 0.5 ? last : secondLast;
            }
        }
    }
    spawnHistory.push(laneIdx);
    if (spawnHistory.length > 2) spawnHistory.shift();

    const obj = obstacleModel.clone();
    const xPos = (laneIdx - 1) * LANE_WIDTH; 
    
    obj.position.set(xPos, 0.7, -90); 
    obj.userData.laneIndex = laneIdx; 
    obj.userData.rotSpeed = {
        x: (Math.random() - 0.5) * 5,
        y: (Math.random() - 0.5) * 5
    };
    
    scene.add(obj);
    obstacles.push(obj);
}

// --- 6. 메인 루프 ---
const clock = new THREE.Clock();

function updateVisuals() {
    laneMeshes.forEach(mesh => {
        mesh.material.emissive.setHex(0x000000);
        mesh.material.color.setHex(0x1a1a1a);
    });

    if(laneMeshes[playerLaneIndex]) {
        laneMeshes[playerLaneIndex].material.emissive.setHex(0x003333); 
        laneMeshes[playerLaneIndex].material.color.setHex(0x1a2a2a);
    }

    obstacles.forEach(obj => {
        const laneIdx = obj.userData.laneIndex;
        if(laneMeshes[laneIdx] && obj.position.z > -80) { 
            const blink = Math.sin(Date.now() * 0.015) > 0; 
            if(blink) {
                laneMeshes[laneIdx].material.emissive.setHex(0x550000); 
            }
        }
    });
}

// [NEW] 폭발 이펙트 시스템
const explosions = [];
const explosionGeo = new THREE.BufferGeometry();
const explosionCount = 30;
explosionGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Array(explosionCount * 3).fill(0), 3));
explosionGeo.setAttribute('velocity', new THREE.Float32BufferAttribute(new Array(explosionCount * 3).fill(0), 3));

function createExplosion(position) {
    const geometry = explosionGeo.clone();
    const velocities = [];
    
    for (let i = 0; i < explosionCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const speed = (Math.random() * 0.5) + 0.2;
        
        velocities.push(
            speed * Math.sin(phi) * Math.cos(theta),
            speed * Math.sin(phi) * Math.sin(theta),
            speed * Math.cos(phi)
        );
    }
    
    geometry.setAttribute('velocity', new THREE.Float32BufferAttribute(velocities, 3));
    
    const material = new THREE.PointsMaterial({
        color: 0x00ffff,
        size: 0.8,
        transparent: true,
        opacity: 1.0,
        blending: THREE.AdditiveBlending
    });

    const points = new THREE.Points(geometry, material);
    points.position.copy(position);
    scene.add(points);
    
    explosions.push({
        mesh: points,
        age: 0
    });
}

function updateExplosions() {
    for (let i = explosions.length - 1; i >= 0; i--) {
        const explosion = explosions[i];
        explosion.age += 1;
        
        const positions = explosion.mesh.geometry.attributes.position.array;
        const velocities = explosion.mesh.geometry.attributes.velocity.array;
        
        for (let j = 0; j < explosionCount; j++) {
            positions[j * 3] += velocities[j * 3];
            positions[j * 3 + 1] += velocities[j * 3 + 1];
            positions[j * 3 + 2] += velocities[j * 3 + 2];
        }
        
        explosion.mesh.geometry.attributes.position.needsUpdate = true;
        explosion.mesh.material.opacity = 1.0 - (explosion.age / 40);
        
        if (explosion.age > 40) {
            scene.remove(explosion.mesh);
            explosion.mesh.geometry.dispose();
            explosion.mesh.material.dispose();
            explosions.splice(i, 1);
        }
    }
}

function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    const time = clock.elapsedTime;

    // [NEW] 카메라 쉐이크 복구
    cameraShakeY *= 0.9; // 점차 감소
    camera.position.y = 7 + cameraShakeY; 
    camera.position.x = (Math.random() - 0.5) * cameraShakeY * 0.5; 

    if (player) {
        const targetX = (playerLaneIndex - 1) * LANE_WIDTH;
        player.position.x += (targetX - player.position.x) * 0.2; 
        player.rotation.z = (player.position.x - targetX) * 0.15; 
        player.position.y = 0.3 + (Math.sin(time * 30) * 0.02);
    }

    updateVisuals();
    updateExplosions(); // [NEW] 이펙트 업데이트

    // [음악 반응 로직]
    if (isPlaying && analyser) {
        analyser.getByteFrequencyData(dataArray);
        let bass = 0; 
        for(let i=0; i<10; i++) bass += dataArray[i];
        bass = bass / 10;

        // [동적 비트 감지 알고리즘]
        const isBeat = bass > averageBass * 1.2 && bass > 50;
        averageBass = averageBass * 0.95 + bass * 0.05;

        // 배경 네온 도형 스케일링
        const scale = 1.0 + (bass / 255) * 1.5; 
        neonShapes.forEach(shape => {
            shape.scale.set(scale, scale, scale);
            shape.rotation.y += 0.005;
            shape.rotation.x += 0.005;
        });

        const now = Date.now();
        // 비트 발생 시 액션
        if (isBeat && now - lastBeatTime > 400) { 
            spawnObstacle();
            lastBeatTime = now;
            
            // [비트 효과] 
            bloomPass.strength = 2.5; 
            cameraShakeY = 0.3; // 카메라 쿵!
            
            setTimeout(() => bloomPass.strength = 1.2, 100);
        }
    } else {
        neonShapes.forEach(shape => {
            shape.rotation.y += 0.005;
            shape.rotation.x += 0.005;
        });
    }

    for (let i = obstacles.length - 1; i >= 0; i--) {
        const obj = obstacles[i];
        obj.position.z += GAME_SPEED; 
        
        obj.rotation.x -= 0.1 * delta; 
        obj.rotation.y += (obj.userData.rotSpeed.y * 0.1) * delta;

        // [NEW] 플레이어를 통과했을 때 이펙트 발생
        if (!obj.userData.passed && obj.position.z > 2.0) {
            obj.userData.passed = true;
            createExplosion(obj.position);
            // 약간의 점수 효과음이나 시각적 피드백 추가 가능
            bloomPass.strength = 2.0;
            setTimeout(() => bloomPass.strength = 1.2, 50);
        }

        if (obj.position.z > -2 && obj.position.z < 2) {
            if (Math.abs(obj.position.x - player.position.x) < 2.0) { 
                gameOver();
            }
        }
        
        if (obj.position.z > camera.position.z) {
            scene.remove(obj);
            obstacles.splice(i, 1);
            score += 100;
            scoreBoard.innerText = `SCORE: ${score}`;
        }
    }

    composer.render();
}

function gameOver() {
    if(!isPlaying) return;
    isPlaying = false;
    instruction.parentElement.style.display = 'flex';
    if(touchControls) touchControls.style.display = 'none';

    instruction.innerHTML = `<h1 style="color:red">IMPACT DETECTED</h1><p style="font-size:24px;">${score}</p><p>DROP MUSIC TO RETRY</p>`;
    
    // 게임 오버 시에도 파일 업로드 버튼 복구
    instruction.innerHTML += `
        <input type="file" id="file-input-retry" accept="audio/*" style="display: none;">
        <label for="file-input-retry" id="upload-btn" style="display:inline-block; margin-top:20px;">TRY AGAIN</label>
    `;
    
    setTimeout(() => {
        const retryInput = document.getElementById('file-input-retry');
        if(retryInput) {
            retryInput.addEventListener('change', handleFileSelect);
        }
    }, 100);

    if(source) {
        try { source.stop(); } catch(e){}
    }
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    composer.setSize(window.innerWidth, window.innerHeight);
});