import numpy as np, math, sys, json
exec(open('/home/claude/specs_raw.py').read().replace(';', ''))

UP = np.array([0.0, 0.0, 1.0]); ALT = np.array([1.0, 0.0, 0.0])

def rotx(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[1,0,0,0],[0,c,-s,0],[0,s,c,0],[0,0,0,1.0]])
def roty(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c,0,s,0],[0,1,0,0],[-s,0,c,0],[0,0,0,1.0]])
def rotz(a):
    c, s = math.cos(a), math.sin(a)
    return np.array([[c,-s,0,0],[s,c,0,0],[0,0,1,0],[0,0,0,1.0]])
def trans(x, y, z):
    m = np.eye(4); m[:3, 3] = [x, y, z]; return m
def apply(M, v):
    r = M @ np.array([v[0], v[1], v[2], 1.0]); return r[:3]

def rounded_tube(points, radii, seg=20, cap=6, eps=0.004):
    N = len(points); P = []; R = []
    t0 = points[1] - points[0]; t0 /= np.linalg.norm(t0)
    tL = points[N-1] - points[N-2]; tL /= np.linalg.norm(tL)
    for k in range(cap):
        phi = (math.pi/2) * k / cap
        P.append(points[0] - t0 * radii[0] * math.cos(phi))
        R.append(max(radii[0] * math.sin(phi), eps))
    for i in range(N):
        P.append(points[i].copy()); R.append(radii[i])
    for k in range(1, cap+1):
        phi = (math.pi/2) * (1 - k/cap)
        P.append(points[N-1] + tL * radii[N-1] * math.cos(phi))
        R.append(max(radii[N-1] * math.sin(phi), eps))
    M = len(P); verts = []; faces = []
    tg = []
    for i in range(M):
        if i == 0: t = P[1] - P[0]
        elif i == M-1: t = P[M-1] - P[M-2]
        else: t = P[i+1] - P[i-1]
        tg.append(t / np.linalg.norm(t))
    for i in range(M):
        t = tg[i]
        n = UP - t * float(np.dot(UP, t))
        if float(np.dot(n, n)) < 1e-4:
            n = ALT - t * float(np.dot(ALT, t))
        n /= np.linalg.norm(n)
        b = np.cross(t, n)
        for k in range(seg):
            a = 2*math.pi*k/seg; cs, sn = math.cos(a), math.sin(a)
            verts.append(P[i] + R[i]*(cs*n + sn*b))
    for i in range(M-1):
        for k in range(seg):
            A = i*seg+k; B = i*seg+(k+1)%seg; C = (i+1)*seg+k; D = (i+1)*seg+(k+1)%seg
            faces.append([A,B,D]); faces.append([A,D,C])
    return np.array(verts), np.array(faces)

def digit_path(M0, lens, radii, close, curl):
    M = M0.copy()
    pts = [M[:3,3].copy()]; rr = [radii[0]*1.05]; S = 5
    for i in range(len(lens)):
        M = M @ rotx(curl*close[i])
        L = lens[i]
        for s in range(1, S+1):
            pts.append(apply(M, [0, L*s/S, 0]))
            rr.append(radii[i] + (radii[i+1]-radii[i])*(s/S))
        M = M @ trans(0, L, 0)
    return pts, rr

def finger_geo(spec, curl):
    M0 = trans(*spec['base']) @ rotz(spec['splay'])
    pts, rr = digit_path(M0, spec['lens'], spec['radii'], FINGER_CLOSE, curl)
    return rounded_tube([np.array(p) for p in pts], rr, 20)

def thumb_geo(spec, curl):
    M0 = trans(*spec['base']) @ rotz(spec['rotZ']) @ rotx(spec['rotX'])
    pts, rr = digit_path(M0, spec['lens'], spec['radii'], THUMB_CLOSE, curl)
    return rounded_tube([np.array(p) for p in pts], rr, 18)

def palm_geo():
    pts = [np.array(p, dtype=float) for p in PALM_SPINE]
    v, f = rounded_tube(pts, PALM_RADII, 30)
    v = v * np.array(PALM_FLAT)
    return v, f

CLASP = { 'thumb':0.10, 'index':0.90, 'middle':0.93, 'ring':0.95, 'pinky':0.97 }
CFG = dict(ORIENT_FLIP=0, ORIENT_PITCH=math.pi/2, ORIENT_ROLL=-math.pi/2,
           VIEW_PITCH=0.14, VIEW_YAW=0.0, FRAME_SCALE=1.06)

def build_hand(curls, thumb_rot_z=0.0, thumb_rot_x=0.0, thumb_y=0.0):
    parts = []
    for spec in FINGER_SPEC:
        parts.append(finger_geo(spec, curls[spec['name']]))
    tv, tf = thumb_geo(THUMB_SPEC, curls['thumb'])
    # mesh-level extras: rotate about model origin, then lift along +Y
    Rz = rotz(thumb_rot_z)[:3,:3]; Rx = rotx(thumb_rot_x)[:3,:3]
    tv = (tv @ Rz.T) @ Rx.T
    tv = tv + np.array([0.0, thumb_y, 0.0])
    parts.append((tv, tf))
    parts.append(palm_geo())
    verts = []; faces = []; off = 0
    for v, f in parts:
        verts.append(v); faces.append(f + off); off += len(v)
    V = np.vstack(verts); F = np.vstack(faces)
    # class presentation: ORIENT roll*pitch*flip, then VIEW premultiplied
    ORIENT = rotz(CFG['ORIENT_ROLL']) @ rotx(CFG['ORIENT_PITCH']) @ roty(CFG['ORIENT_FLIP'])
    VIEW = roty(CFG['VIEW_YAW']) @ rotx(CFG['VIEW_PITCH'])   # three Euler 'YXZ'
    M = VIEW @ ORIENT
    V = V @ M[:3,:3].T
    V = V * CFG['FRAME_SCALE']
    center = (V.min(axis=0) + V.max(axis=0)) / 2
    V = V - center
    return V, F

def holder(V, yaw, pitch, roll, x, y, z, scale, mirror=False):
    R = roty(math.radians(yaw)) @ rotx(math.radians(pitch)) @ rotz(math.radians(roll))  # 'YXZ'
    W = (V * scale) @ R[:3,:3].T
    if mirror:
        W = W * np.array([-1.0, 1.0, 1.0])   # world-space reflection, then translate
    return W + np.array([x, y, z])

def render(tune, out='/home/claude/stage.png'):
    import trimesh, pyrender, os
    os.environ.setdefault('PYOPENGL_PLATFORM', 'egl')
    V, F = build_hand(CLASP, thumb_rot_z=tune.get('restArc',0.12), thumb_y=tune['pThumbY'])
    Vp = holder(V, tune['pYaw'], tune['pPitch'], tune['pRoll'],
                tune['pX'], tune['yBase'], tune['pZ'], tune['scale'], mirror=bool(tune.get('mirrorP',1)))
    V2, F2 = build_hand(CLASP, thumb_rot_z=-tune.get('restArc',0.12), thumb_y=tune['hThumbY'])
    Vh = holder(V2, tune['hYaw'], tune['hPitch'], tune['hRoll'],
                tune['hX'], tune['yBase'], tune['hZ'], tune['scale'])
    scene = pyrender.Scene(bg_color=[10/255,10/255,10/255,1.0], ambient_light=[0.25,0.24,0.23])
    mat = pyrender.MetallicRoughnessMaterial(baseColorFactor=[0.85,0.816,0.76,1.0],
                                             roughnessFactor=0.85, metallicFactor=0.0, doubleSided=True)
    for W, FF in [(Vp, F), (Vh, F2)]:
        tm = trimesh.Trimesh(vertices=W, faces=FF, process=False)
        scene.add(pyrender.Mesh.from_trimesh(tm, material=mat, smooth=True))
    key = pyrender.DirectionalLight(color=[1.0,0.96,0.93], intensity=3.2)
    kp = np.eye(4); kz = np.array([2.4,3.4,3.6]); kz = kz/np.linalg.norm(kz)
    zax = kz; xax = np.cross([0,1,0], zax); xax = xax/np.linalg.norm(xax); yax = np.cross(zax, xax)
    kp[:3,0], kp[:3,1], kp[:3,2] = xax, yax, zax
    scene.add(key, pose=kp)
    fillp = np.eye(4); fillp[:3,3] = [-2.6, 0.6, 3.0]
    scene.add(pyrender.PointLight(color=[0.86,0.9,1.0], intensity=14.0), pose=fillp)
    rimp = np.eye(4); rimp[:3,3] = [-2.8, -1.2, 1.4]
    scene.add(pyrender.PointLight(color=[0.77,0.07,0.19], intensity=10.0), pose=rimp)
    cam = pyrender.PerspectiveCamera(yfov=math.radians(tune['fov']), aspectRatio=1080/1240)
    eye = np.array([0.0, tune['camY'], tune['camZ']])
    z = eye / np.linalg.norm(eye)
    x = np.cross([0,1,0], z); x = x/np.linalg.norm(x); y = np.cross(z, x)
    cp = np.eye(4); cp[:3,0], cp[:3,1], cp[:3,2], cp[:3,3] = x, y, z, eye
    scene.add(cam, pose=cp)
    r = pyrender.OffscreenRenderer(540, 620)
    color, _ = r.render(scene)
    from PIL import Image
    Image.fromarray(color).save(out)
    r.delete()
    print('rendered', out, json.dumps(tune))

CLASP_D = dict(CLASP)
def phase_pose(phase, tune):
    pT = dict(CLASP_D); hT = dict(CLASP_D)
    pArc = tune['restP']; hArc = tune['restH']
    pRX = hRX = 0.0; dxP = dxH = 0.0
    if phase == 'h_tele':
        hT['thumb'] = 0.02; hArc = 0.42
    elif phase == 'h_pin':
        hT['thumb'] = 0.60; hArc = -0.20; hRX = -1.05; dxH = 0.12
        pT['thumb'] = 0.78; pArc = -0.60; pRX = 0.75
    elif phase == 'p_pin':
        pT['thumb'] = 0.60; pArc = 0.15; pRX = -0.90; dxP = -0.12
        hT['thumb'] = 0.78; hArc = 0.55; hRX = 0.60
    return pT, hT, pArc, hArc, pRX, hRX, dxP, dxH

def render_phase(phase, tune):
    import trimesh, pyrender, os
    os.environ.setdefault('PYOPENGL_PLATFORM', 'egl')
    pT, hT, pArc, hArc, pRX, hRX, dxP, dxH = phase_pose(phase, tune)
    pLift = tune['pThumbY'] * (1 - pT['thumb'])
    hLift = tune['hThumbY'] * (1 - hT['thumb'])
    V, F = build_hand(pT, thumb_rot_z=pArc, thumb_rot_x=pRX, thumb_y=pLift)
    Vp = holder(V, tune['pYaw'], tune['pPitch'], tune['pRoll'],
                tune['pX']+dxP, tune['yBase'], tune['pZ'], tune['scale'], mirror=True)
    V2, F2 = build_hand(hT, thumb_rot_z=-hArc, thumb_rot_x=hRX, thumb_y=hLift)
    Vh = holder(V2, tune['hYaw'], tune['hPitch'], tune['hRoll'],
                tune['hX']+dxH, tune['yBase'], tune['hZ'], tune['scale'])
    scene = pyrender.Scene(bg_color=[10/255,10/255,10/255,1.0], ambient_light=[0.25,0.24,0.23])
    mat = pyrender.MetallicRoughnessMaterial(baseColorFactor=[0.85,0.816,0.76,1.0],
                                             roughnessFactor=0.85, metallicFactor=0.0, doubleSided=True)
    for W, FF in [(Vp, F), (Vh, F2)]:
        tm = trimesh.Trimesh(vertices=W, faces=FF, process=False)
        scene.add(pyrender.Mesh.from_trimesh(tm, material=mat, smooth=True))
    key = pyrender.DirectionalLight(color=[1.0,0.96,0.93], intensity=3.2)
    kp = np.eye(4); kz = np.array([2.4,3.4,3.6]); kz = kz/np.linalg.norm(kz)
    xax = np.cross([0,1,0], kz); xax/=np.linalg.norm(xax); yax = np.cross(kz,xax)
    kp[:3,0],kp[:3,1],kp[:3,2] = xax,yax,kz
    scene.add(key, pose=kp)
    fp = np.eye(4); fp[:3,3] = [-2.6,0.6,3.0]
    scene.add(pyrender.PointLight(color=[0.86,0.9,1.0], intensity=14.0), pose=fp)
    rp = np.eye(4); rp[:3,3] = [-1.6,-2.4,2.8]
    scene.add(pyrender.PointLight(color=[0.77,0.07,0.19], intensity=4.0), pose=rp)
    cam = pyrender.PerspectiveCamera(yfov=math.radians(tune['fov']), aspectRatio=1.0)
    eye = np.array([0.0, tune['camY'], tune['camZ']])
    aim = np.array([tune.get('lookX',0.0), tune.get('lookY',0.0), 0.0])
    z = (eye-aim); z/=np.linalg.norm(z); x = np.cross([0,1,0],z); x/=np.linalg.norm(x); y = np.cross(z,x)
    cp = np.eye(4); cp[:3,0],cp[:3,1],cp[:3,2],cp[:3,3] = x,y,z,eye
    scene.add(cam, pose=cp)
    r = pyrender.OffscreenRenderer(420, 420)
    color, _ = r.render(scene); r.delete()
    return color

def sheet(tune, out='/home/claude/stage_sheet.png'):
    from PIL import Image, ImageDraw
    names = ['neutral','h_tele','h_pin','p_pin']
    tiles = []
    for n in names:
        img = Image.fromarray(render_phase(n, tune))
        d = ImageDraw.Draw(img); d.text((10,8), n.upper(), fill=(255,51,51))
        tiles.append(img)
    W = Image.new('RGB', (840, 840))
    W.paste(tiles[0],(0,0)); W.paste(tiles[1],(420,0)); W.paste(tiles[2],(0,420)); W.paste(tiles[3],(420,420))
    W.save(out); print('sheet', out, json.dumps(tune))

if __name__ == '__main__':
    tune = dict(scale=0.92, camY=3.1, camZ=3.1, fov=40, yBase=-0.05,
                pX=-0.55, pZ=0.0, pYaw=102, pPitch=-18, pRoll=-8,
                hX=0.55, hZ=0.0, hYaw=102, hPitch=-18, hRoll=-8,
                pThumbY=0.5, hThumbY=0.5, restArc=0.12, mirrorP=1)
    tune.update(dict(restP=0.10, restH=0.10, pZ=-0.16, hZ=0.16))
    if len(sys.argv) > 1:
        tune.update(json.loads(sys.argv[1]))
    sheet(tune)
