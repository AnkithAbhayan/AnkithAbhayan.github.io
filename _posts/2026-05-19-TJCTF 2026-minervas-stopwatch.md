---
title: TJCTF 2026 - minervas-stopwatch
date: 2026-05-19 16:30:00 +0530
categories: [TJCTF 2026]
tags: [ECDSA, ECC]
excerpt: "listen closely, it has a lot to say."
math: true
---

> listen closely, it has a lot to say.

## Source files: 
[trace.csv](https://tjctf-2026-infra.storage.googleapis.com/uploads/3c4828262c43fcd1f0d51e532f10cc19928bcf06e8888e5a340bdf63aa5d4233/trace.csv), [flag.enc](https://tjctf-2026-infra.storage.googleapis.com/uploads/62933fdc9ae96431c1486606d35cdadc44bd3c9c760bc26c34e2ef432459c611/flag.enc), [public_key.txt](https://tjctf-2026-infra.storage.googleapis.com/uploads/bc721474df7ad77c1369329908265aee1756899ad75b07e321875ab76c7bc588/public_key.txt)

# The challenge
In this challenge we are given samples of ECDSA signatures along with the time it took to generate each signature.  
from `trace.csv`:
```
id,msg_hex,h,r,s,elapsed_ns
0,8c31bb9d257ccb5f1d14e67e95ae64bb2ed5d5d3b0772187dee3912b38dffa6f,f0a44d2958f384cb6715563f4ce4c3339af0e9eb8daa82cdda1a2b317766edc6,95b135e1f4e4a234a90fbed75a048c91697b78b1c7836bacbb32e89b4beb9ed0,4f2e9ec3eaded08cbaa17e65179594321e9d7a23748dc12d857699aa94bb858a,197541
1,f78178a361ca845e7e11473f9f6fc4d4c76d84b8c70ff36e046d477fbc991aee,1baeb0c282830d9362f46ceb97fde4efdce569ef517afcc672693005b657437e,a933f8eeed9d404fb6fe997b77b10fe2602f6f1c38d02b2ee6340960e9056920,c5190af7fd81fcf31078b06777a6cc5ba7abf5796816e4cfe7336b0e1650de8c,197491
2,be0f1fc9b890763f47c5ce8768810931d6e36abba4aecace1a67bad1a711e063,b0cbbf0b095b5a880c58b0cff30d62bc9be22e9f621b695a1f4f64ef31a6baba,e141e7e7bad835f2540660584487e2932145a6d11f5d0b6aba4aac97ec7323fc,2e7d4f1efc46c756524a78b40d84ec263c2218799d594fdcc1a80d1ff78e0fbc,197253
.
.
```
There exists 1600 such signatures.  
Our goal is to figure out the private key used and decrypt the flag.  

# The vulnerability
Leaking the time it takes to generate each signature is a vulnerability in and of itself as it allows us to estimate the bit length of the nonce used.  
A nonce of higher bit length would slow down the signing process, making the elapsed time larger.  
The signatures corresponding to the shorter elapsed time would involve a nonce with a smaller bit length, allowing us to employ the **zero-MSB** case of the **ECDSA biased nonce attack**.  
  
What we can do now is sort all of the traces by elapsed time and work with the first few samples.  
  
## ECDSA biased nonce attack
This attack works when you have a set of ECDSA signatures where each nonce is biased (a few bits LSB or MSB is always 0).  
This can be modeled as an instance of a hidden number problem (HNP) which is a cryptographic problem solvable with lattice reduction.  
  
## The Hidden number problem
The hidden number problem involves solving for $α$ given in the set of equations:
#### $$β_i - t_i.α + a_i = 0\pmod{p}$$$\,$
$\,$  
Given the $m$ equations with these coefficients $(t_i, a_i)^{m}$ as well as $p$ known to us ($β_i$ is not known)  
We can rewrite the equation as:  
##### $β_i - t_i.α + a_i = k_i.p$  
##### $β_i + a_i = k_i.p + t_i.α$
$\,$  
Now, lattices that allows us to solve for $α$ is as follows:  
(Vectors are rows and not columns)
  
$$B = \begin{bmatrix}
p &  \\
 & p \\
 & & \ddots \\
 & & & p \\
 t_1 & t_2 & \dots & t_m & \frac{1}{p}
\end{bmatrix}$$
  
Here, the linear combination $x = (k_1, k_2, \dots k_m, α)$  
produces the vector $xB = (\{β_1 + a_1,  β_2 + a_2,  \dots, β_m + a_m, α/p)\}$  
Multiplying the last value by $p$ gives us the hidden number $α$.  
Subtracting the known values of $a_i$ from $xB$ gives us the values of $β_i$  
  
A theoretically better approach would be to convert this CVP problem to a SVP problem by embedding the vector with $a_i$'s as follows:  
  
$$B = \begin{bmatrix}
p &  \\
 & p \\
 & & \ddots \\
 & & & p \\
 t_1 & t_2 & \dots & t_m & \frac{B}{p}\\
 a_1 & a_2 & \dots & a_m &&B
\end{bmatrix}$$  
  
$B$ is the upper bound on $α$.  
Here, the linear combination $x=\(k_1, k_2, \dots, k_m, α, -1\)$  
Gives the short vector $xB = \(a_1, a_2, \dots, a_m, \frac{α.B}{p}, -B\)$  
By observing the last value to be $-B$ (or $B$ if we get the negative vector)  
we can multiply the 2nd last value by $\frac{p}{B}$ to get the hidden number $α$  
  
## ECDSA private key as an HNP  
We can interpret the private key $x$ to be the hidden number in the HNP problem. 
The lattice construction then becomes (assuming that we have three messages)
  
$$\begin{bmatrix}
N \\
& N \\
& & \ddots \\
& & & N \\
r_1.s_1^{-1} & r_2.s_2^{-1} & \dots & r_n.s_3^{-1} & \frac{B}{N} \\
m_1.s_1^{-1} & m_2.s_2^{-1} & \dots & m_n.s_3^{-1} & & B
\end{bmatrix}$$
  
Here, $s_i^{-1}$ is the inverse of the $i^{th}$ signature, $m_i$ is the hash of the message in $i^{th}$ signature and B is the upper bound on the nonce used to sign these messages. In our case B is just N. 

The linear combination $\(j_1, j_2, j_3, \dots, j_n, x, 1\)$   
returns the short vector  $\{(k_1, k_2, k_3, \dots, k_n, \frac{xB}{N}, B\})$  
Where $k_i$ is the nonce of the $i^{th}$ message and $x$ is the private key.  
  
### Why does this work?  
Let us observe just the first column:  
$N*j_1 + x.(r_1.s_1^{-1}) + 1(m_1.s_1^{-1})$  

$\implies N*j_1 + s_1^{-1}(m_1 + x.r_1)$  

$\implies N*j_1 + (k_1^{-1}(m_1 + x.r_1))^{-1}(m_1+x.r_1)$  

$\implies N*j_1 + k_1(m_1+x.r_1)^{-1}(m_1+x.r_1)$  

$\implies N*j_1 + k_1$  

$\implies k_1$  
  
As we can see, we are simply working with an instance of the hidden number problem where  
$t_i = r_i.s_i^{-1}$,  
$a_i = m_i.s_i^{-1}$  
and $\alpha = x$ which is the private key.  
  
We can verify that the private key is correct by multiplying the generator of the elliptic curve (secp256r1) with it and checking if it equals the public key in `public_key.txt`.  
  
## Optimizations
The above lattice works if the bit length of the biased nonces are the same.
Here it is not, which is where the minerva attack comes in.  

From their [proof-of-concept](https://github.com/daedalus/minerva_all_poc/blob/master/poc/attack/attack.py) code, we can see that they account for the varying nonce bit lengths by scaling the columns corresponding to the traces with higher bit length  nonce by a higher power of two. 
We don't have to work with all 1600 signatures as that would make LLL/BKZ take a lot of time, instead we can work with the 60 fastest signatures.  
  
The powers I used were defined by this function  
```python
def bound(i, d):
    if i < d / 16:
        return 9
    if i < d / 8:
        return 8
    if i < d / 4:
        return 6
    if i < d / 2:
        return 5
    return 4
```
$i$ represents the index of the trace (lower index = lower bit length nonce)  
$d$ represents the total sample size (60 here)  
  
So, my new lattice basis looks like this:  
  
$$\begin{bmatrix}
p_0*N \\
& p_1*N \\
& & \ddots \\
& & & p_{60}*N \\
p_0*r_1.s_1^{-1} & p_1*r_2.s_2^{-1} & \dots & p_{60}*r_{60}.s_3^{-1} & 1 \\
p_0*m_1.s_1^{-1} & p_1*m_2.s_2^{-1} & \dots & p_{60}*m_{60}.s_3^{-1} & & N
\end{bmatrix}$$  
  
$p_i$ represents `bound(i, d)`  
Running progressive BKZ on this (instead of LLL) with the block sizes `[5, 15, 20, 25, 30, 35, 40, 45, 50]`   
allowed me to recover the private key:  
```
39874942676928486077447548456399827891252087986098872307750937177513920198865
```
  
## Final decryption  
Now all that was left to do was to decrypt the flag.  
Decryption was just XOR, with the keystream defined as:  
`SHA256(seed || 1) + SHA256(seed || 2) + ...`  
where seed is `SHA256(private_key)`  
  
## solve.sage
```python
import hashlib
from fpylll import BKZ, IntegerMatrix

with open("trace.csv") as f:
    data = [item.split(",") for item in f.read().split("\n")][1:-1]
data.sort(key=lambda x:int(x[-1]))
data = [list(map(lambda x: int(x, 16), data[i][2:5])) for i in range(len(data))]

a = 0xffffffff00000001000000000000000000000000fffffffffffffffffffffffc
b = 0x5ac635d8aa3a93e7b3ebbd55769886bc651d06b0cc53b0f63bce3c3e27d2604b
G = (0x6b17d1f2e12c4247f8bce6e563a440f277037d812deb33a0f4a13945d898c296, 0x4fe342e2fe1a7f9b8ee7eb4a7c0f9e162bce33576b315ececbb6406837bf51f5)
Qx = 0xa51b379a175d3a2593d698e47379becb0c1a541357bca5aa8324edf182a7ac44
Qy = 0x00c4b6868e9610c21282b31fb59d988f842fa4179ce9803c84de2501391cc656

p = 0xffffffff00000001000000000000000000000000ffffffffffffffffffffffff # secp256r1
N = 0xFFFFFFFF00000000FFFFFFFFFFFFFFFFBCE6FAADA7179E84F3B9CAC2FC632551
E = EllipticCurve(GF(p), [a,b])
G = E(G)
Q = E(Qx, Qy)

def verify_x(row):
    x = int(row[-2])%N
    if x*G == Q:
        return x
    elif (N-x)*G == Q:
        return N-x
    return False

def bound(i, d):
    if i < d / 16:
        return 9
    if i < d / 8:
        return 8
    if i < d / 4:
        return 6
    if i < d / 2:
        return 5
    return 4

M = IntegerMatrix(62, 62)

for i in range(60):
    h,r,s = data[i]
    scale = 2**bound(i, 60)
    M[i, i] = scale*N
    M[60, i] = scale*((r*pow(s, -1, N))%N)
    M[61, i] = scale*((-h*pow(s, -1, N))%N)

M[60, 60] = 1
M[61, 61] = N

for i in [5, 15, 20, 25, 30, 35, 40, 45, 50]:
    M = BKZ.reduction(M, BKZ.Param(block_size=i, auto_abort=True))
    rows = M
    for row in rows:
        if (x:=verify_x(row)):
            break
    else:
        continue
    break

# decrypt flag.enc
c = bytes.fromhex(open("flag.enc").read().strip())
seed = hashlib.sha256(x.to_bytes(32, "big")).digest()
keystream = b""
i = 0
while len(keystream) < len(c):
    keystream += hashlib.sha256(seed + i.to_bytes(4, "big")).digest()
    i += 1
flag = bytes(x ^^ y for x, y in zip(c, keystream)).decode()

print(flag)
```

## Flag
```
tjctf{m1n3rv4_h34rd_th3_n0nc3_tick}
```

## References
- https://github.com/tlsfuzzer/python-ecdsa/security/advisories/GHSA-wj6h-64fc-37mp
- https://blog.trailofbits.com/2020/06/11/ecdsa-handle-with-care/