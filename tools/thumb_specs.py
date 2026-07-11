FINGER_SPEC = [
  { 'name':'index',  'base':[-0.32, 0.40, 0.00], 'splay': 0.05, 'lens':[0.48,0.32,0.25], 'radii':[0.112,0.099,0.084,0.058] },
  { 'name':'middle', 'base':[-0.10, 0.44, 0.015],'splay': 0.00, 'lens':[0.56,0.37,0.27], 'radii':[0.118,0.104,0.088,0.061] },
  { 'name':'ring',   'base':[ 0.11, 0.41, 0.00], 'splay':-0.05, 'lens':[0.50,0.34,0.26], 'radii':[0.110,0.097,0.082,0.058] },
  { 'name':'pinky',  'base':[ 0.31, 0.36,-0.01], 'splay':-0.13, 'lens':[0.39,0.27,0.22], 'radii':[0.096,0.085,0.072,0.050] },
];
THUMB_SPEC = { 'name':'thumb', 'base':[-0.39, 0.03, 0.15], 'rotZ':1.12, 'rotX':-0.52, 'lens':[0.31,0.23], 'radii':[0.152,0.128,0.102] };
FINGER_CLOSE = [1.45, 1.68, 1.05];   
THUMB_CLOSE  = [1.05, 0.90];
PALM_SPINE = [[0,0.40,0],[0,0.14,0],[-0.02,-0.14,0],[-0.02,-0.40,0],[-0.02,-0.68,0],
                    [-0.02,-1.05,0],[-0.02,-1.45,0]];  
PALM_RADII = [0.44,0.48,0.44,0.39,0.34,0.30,0.27];
PALM_FLAT  = [1.08,1.0,0.52];


POSES = {
  'paper':    { 'thumb':0.05, 'index':0,   'middle':0,   'ring':0,   'pinky':0    },
  'rock':     { 'thumb':1.0,  'index':1,   'middle':1,   'ring':1,   'pinky':1    },
  'scissors': { 'thumb':0.95, 'index':0,   'middle':0,   'ring':1,   'pinky':1    },
  'ready':    { 'thumb':0.28, 'index':.12, 'middle':.12, 'ring':.15, 'pinky':.18  },
};

THUMB_CLOSE = [1.05, 0.90]
PALM_FLAT = [1.08,1.0,0.52]
