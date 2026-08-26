import math, json
from coloraide import Color

# ---------- helpers ----------
def oklch(c): 
    o = Color(c).convert('oklch')
    L = o['lightness']; C = o['chroma']; h = o['hue']
    if h != h: h = 0.0
    return L, C, h

def lum(c):
    return Color(c).luminance()

def wcag(a,b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la,lb), min(la,lb)
    return (hi+0.05)/(lo+0.05)

def deltaEOKr2(c1,c2):
    K1,K2 = 0.206,0.03; K3=(1+K1)/(1+K2)
    def toe(x): return 0.5*(K3*x-K1+math.sqrt((K3*x-K1)**2+4*K2*K3*x))
    a1=Color(c1).convert('oklab'); a2=Color(c2).convert('oklab')
    dL=toe(a1['lightness'])-toe(a2['lightness'])
    da=2*(a1['a']-a2['a']); db=2*(a1['b']-a2['b'])
    return math.sqrt(dL*dL+da*da+db*db)

# ---------- sRGB cusp per hue (cached scan) ----------
_cusp={}
def cusp(h):
    key=round(h,1)
    if key in _cusp: return _cusp[key]
    best=(0,0)
    L=0.02
    while L<=0.999:
        # binary search max in-gamut chroma at (L,h)
        lo,hi=0.0,0.45
        for _ in range(28):
            mid=(lo+hi)/2
            if Color('oklch',[L,mid,h]).in_gamut('srgb', tolerance=0.0001): lo=mid
            else: hi=mid
        if lo>best[1]: best=(L,lo)
        L+=0.005
    _cusp[key]=best
    return best

def ST(h):
    Lc,Cc=cusp(h)
    return Cc/Lc, Cc/(1-Lc), Lc, Cc

def softmin(a,b,p): 
    if a<=0 or b<=0: return 0.0
    return (1/(1/a**p + 1/b**p))**(1/p)

def cmax_curve(L,h,p=4,k=1.0):
    S,T,_,_=ST(h)
    return k*softmin(L*S,(1-L)*T,p)

# ---------- lightness from target contrast vs surface ----------
def L_for_contrast_vs_white(cr):
    # Y such that 1.05/(Y+0.05) = cr
    Y = 1.05/cr - 0.05
    return max(Y, 0.0)

def oklabL_from_Y(Y):
    # gray with that luminance
    c = Color('xyz-d65', [Y*0.9505, Y, Y*1.089])
    return c.convert('oklch')['lightness']

# ---------- ramp ----------
SHADES = ['50','100','200','300','400','500','600','700','800','900']
K_CR   = 0.304          # ln(4.5)/5 + buffer  -> 5 index steps guarantee AA
OFFSET = 0.55

def contrast_ladder():
    return [math.exp(K_CR*(i+OFFSET)) for i in range(10)]

# accent shades: vivid track, anchored at these contrast indices
ACCENTS = {'A100':1.4,'A200':2.6,'A400':4.2,'A700':6.2}

def torsion_for(h, mode='stable'):
    if mode=='none': return 0.0
    if mode=='gamut':
        if 30<=h<=115: return 55.0     # warm: hue rises with L
        if 195<=h<=285: return -22.0   # cool: hue falls with L
        return 0.0
    return 0.0

def blue_correction(h,L):
    if 255<=h<=295 and L>0.55: return 33.0*(L-0.55)
    if (235<=h<255 or 300<h<=355) and L>0.60: return 20.0*(L-0.60)
    return 0.0

def envelope(t,a=0.30,q=2.5):
    return 1 - a*abs(2*t-1)**q

NEUTRAL_C = 0.02      # below this the seed carries no usable hue signal

def solve_L(cr, h, s0, t, p, surface_Y=1.0, iters=4):
    """Solve OKLab L so that the FINAL chromatic color hits the target contrast."""
    Y = (surface_Y+0.05)/cr - 0.05
    L = oklabL_from_Y(max(Y,0.0))
    for _ in range(iters):
        hh = h
        C = s0*envelope(t)*cmax_curve(L,hh,p)
        c = Color('oklch',[L,C,hh]).fit('srgb', method='oklch-chroma')
        got = (surface_Y+0.05)/(c.luminance()+0.05)
        if abs(got-cr) < 0.005: break
        L *= 1 + 0.55*(got-cr)/cr      # chromatic colors are brighter -> raise contrast by lowering L
        L = min(max(L,0.02),0.995)
    return L

def build(seed, surface='#fff', tors='stable', s_floor=0.30, p=4):
    Ls,Cs,hs = oklch(seed)
    neutral = Cs < NEUTRAL_C
    Cm_seed = cmax_curve(Ls,hs,p)
    s0 = min(1.0, Cs/Cm_seed) if Cm_seed>0 else 0
    s0 = 0.0 if neutral else max(s0, s_floor)
    tau = torsion_for(hs,tors)
    out={}
    ladder = contrast_ladder()
    n=len(ladder)
    for i,(name,cr) in enumerate(zip(SHADES,ladder)):
        t=i/(n-1)
        L=solve_L(cr,hs,s0,t,p)
        h = hs + tau*(L-Ls) + blue_correction(hs,L)
        C = s0*envelope(t)*cmax_curve(L,h,p)
        c = Color('oklch',[L,C,h]).fit('srgb', method='oklch-chroma')
        out[name]=c.convert('srgb').to_string(hex=True)
    for name,cr in ACCENTS.items():
        L=solve_L(cr,hs,(0.0 if neutral else 1.0),0.5,8)
        h = hs + tau*(L-Ls) + blue_correction(hs,L)
        C = (0.0 if neutral else 1.0)*cmax_curve(L,h,p=8)   # vivid track: ride the hull
        c = Color('oklch',[L,C,h]).fit('srgb', method='oklch-chroma')
        out[name]=c.convert('srgb').to_string(hex=True)
    # seed placement
    Lstar=[oklch(out[s])[0] for s in SHADES]
    i_star=min(range(n), key=lambda i: abs(Lstar[i]-Ls))
    return out, dict(seed_L=round(Ls,4), seed_C=round(Cs,4), seed_h=round(hs,2),
                     s0=round(s0,3), snaps_to=SHADES[i_star], tau=tau)

# ---------- current HSL-multiplier approach, replicated ----------
MS={'50':(1.23,1.78),'100':(0.8,1.66),'200':(0.64,1.43),'300':(0.73,1.19),'400':(0.875,1.08),
    '500':(1,1),'600':(1.26,0.89),'700':(1.26,0.81),'800':(1.26,0.73),'900':(1.26,0.64),
    'A100':(1.23,1.34),'A200':(1.22,1.16),'A400':(1.23,0.91),'A700':(1.23,0.65)}
def build_current(seed):
    c=Color(seed).convert('hsl')
    H,S,L=c['hue'],c['saturation'],c['lightness']
    if H!=H: H=0
    out={}
    for k,(sx,lx) in MS.items():
        out[k]=Color('hsl',[H,min(S*sx,1.0),min(L*lx,1.0)]).convert('srgb').to_string(hex=True)
    return out

def report(name, seed, tors='stable'):
    new,meta=build(seed,tors=tors)
    cur=build_current(seed)
    print(f"\n{'='*78}\n{name}  seed={seed}  L={meta['seed_L']:.3f} C={meta['seed_C']:.3f} h={meta['seed_h']:.0f}  s0={meta['s0']} snaps→{meta['snaps_to']}")
    print(f"{'step':6} {'NEW hex':9} {'L':>5} {'C':>6} {'h':>6} {'CRw':>5} {'ΔE':>6} | {'CUR hex':9} {'CRw':>5} {'ΔE':>6}")
    prevN=prevC=None
    for s in SHADES:
        Ln,Cn,hn=oklch(new[s]); crn=wcag(new[s],'#fff')
        crc=wcag(cur[s],'#fff')
        dn=deltaEOKr2(prevN,new[s]) if prevN else 0
        dc=deltaEOKr2(prevC,cur[s]) if prevC else 0
        print(f"{s:6} {new[s]:9} {Ln:5.3f} {Cn:6.4f} {hn:6.1f} {crn:5.2f} {dn:6.4f} | {cur[s]:9} {crc:5.2f} {dc:6.4f}")
        prevN,prevC=new[s],cur[s]
    def spread(hl):
        hl=[h for h in hl]
        best=360
        for ref in hl:
            d=[((h-ref+180)%360)-180 for h in hl]
            best=min(best,max(d)-min(d))
        return best
    hs_n=[oklch(new[s])[2] for s in SHADES]; hs_c=[oklch(cur[s])[2] for s in SHADES]
    print(f"  hue spread  NEW {spread(hs_n):5.1f}°   CUR {spread(hs_c):5.1f}°")
    dn=[deltaEOKr2(new[SHADES[i]],new[SHADES[i+1]]) for i in range(9)]
    dc=[deltaEOKr2(cur[SHADES[i]],cur[SHADES[i+1]]) for i in range(9)]
    print(f"  min ΔEOKr2  NEW {min(dn):.4f}   CUR {min(dc):.4f}   (target ≥0.015)")
    # AA guarantee check for 5-index gaps
    bad=[(SHADES[i],SHADES[i+5],round(wcag(new[SHADES[i]],new[SHADES[i+5]]),2)) for i in range(5) if wcag(new[SHADES[i]],new[SHADES[i+5]])<4.5]
    badc=[(SHADES[i],SHADES[i+5],round(wcag(cur[SHADES[i]],cur[SHADES[i+5]]),2)) for i in range(5) if wcag(cur[SHADES[i]],cur[SHADES[i+5]])<4.5]
    print(f"  5-step AA failures  NEW {bad or 'none'}   CUR {badc or 'none'}")
    print(f"  accents  " + "  ".join(f"{k}={new[k]}" for k in ACCENTS))

for nm,sd in [("ignite primary","#0099ff"),("ignite secondary","#df1b74"),("warn","#faa419"),
              ("success","#4eb862"),("near-white seed","#ffe9b0"),("near-black seed","#141225"),
              ("neon green","#00ff00"),("washed-out mauve","#a99bb0"),("near-gray","#8a8a8a")]:
    report(nm,sd)
