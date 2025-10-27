---
title: CryptoCTF 2025 - Goliver-II
date: 2025-08-08 00:00:00 +0530
categories: [CryptoCTF 2025]
tags: [ecdsa]
math: true
---
  
> **Goliver_II** is an innovative elliptic curve cryptosystem designed to present unique challenges for the new era of cryptographic security.  

<!--more-->

## goliver_ii.py
```python
#!/usr/bin/env python3

from hashlib import sha256
import sys
from Crypto.Util.number import *
from flag import flag

def die(*args):
    pr(*args)
    quit()

def pr(*args):
    s = " ".join(map(str, args))
    sys.stdout.write(s + "\n")
    sys.stdout.flush()

def sc():
    return sys.stdin.buffer.readline()

def ADD(A, B):
    s = (B[1] - A[1]) * inverse(B[0] - A[0], p) % p
    x = (s**2 - A[0] - B[0]) % p
    y = (s * (A[0] - x) - A[1]) % p
    return (x, y)

def DOUBLE(A):
    s = ((3 * A[0] ** 2 + a) * inverse(2 * A[1], p)) % p
    x = (s**2 - 2 * A[0]) % p
    y = (s * (A[0] - x) - A[1]) % p
    return (x, y)

def MUL(A, d):
    _B = bin(d)[2:]
    _Q = A
    for i in range(1, len(_B)):
        _Q = DOUBLE(_Q)
        if _B[i] == "1":
            _Q = ADD(_Q, A)
    return _Q

def GENKEY():
    skey = getRandomRange(1, p)
    pubkey = MUL(G, skey)
    return (pubkey, skey)

def is_valid_k(k, used_k=set()):
    if k in used_k:
        return False
    used_k.add(k)
    return True

def _prepare(sign_id, msg):
    k = sign_id + int.from_bytes(msg, "big")
    if not is_valid_k(k):
        return None
    r, _ = MUL(G, k)
    hmsg = int.from_bytes(sha256(msg).digest(), "big")
    return k, r, hmsg

def sign(sign_id, msg):
    k, r, hmsg = _prepare(sign_id, msg)
    s = (inverse(k, n) * (hmsg + r * skey)) % n
    return s

def verify(sign_id, msg, s):
    _, r, hmsg = _prepare(sign_id, msg)
    u1 = (hmsg * inverse(s, n)) % n
    u2 = (r * inverse(s, n)) % n
    x1, _ = ADD(MUL(G, u1), MUL(pubkey, u2))
    return (x1 % n) == (r % n)

def main():
    border = "┃"
    pr("┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓")
    pr(
        border,
        "Welcome! Our signature is half the size of traditional ECDSA, yet super",
        border,
    )
    pr(
        border,
        "secure with the BTC curve. Try the demo!                               ",
        border,
    )
    pr("┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛")
    global p, a, b, G, n, pubkey, skey
    p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
    a, b = 0, 7
    n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
    x = 0x4F22E22228BD75086D77AE65174C000F132BFD4EF3E28BEF20AC476997D4444F
    y = 0x3456B224247A4F73BF187AC25864F8F694C078380E6BDDF51379AC33F18BD829
    G = (x, y)
    pubkey, skey = GENKEY()
    level, STEP, _b = 0, 3, False
    while True:
        pr(
            "| Options: \n|\t[S]ign flag \n|\t[V]erify sign \n|\t[G]et the flag \n|\t[P]ublic key \n|\t[Q]uit"
        )
        ans = sc().decode().strip().lower()
        if ans == "s":
            pr(border, f"Please provide sign_id:")
            sign_id = sc().decode()
            try:
                sign_id = int(sign_id)
                _b = sign_id > 0
            except:
                die(border, f"The input sign_id you provided is not valid!")
            if _b:
                s = sign(sign_id, msg = flag[:len(flag) >> 1].encode())
                if s is None:
                    die(border, f"Double use of the same sign_id is not possible!")
                pr(border, f"s = {s}")
                if level == STEP:
                    die(border, f"You have only {STEP} rounds to check.")
                else:
                    level += 1
            else:
                die(border, f"sign_id is a positive value! Bye!!")
        elif ans == "v":
            pr(border, "Please send the sign_id, message, and signature: ")
            inp = sc().decode()
            try:
                sign_id, msg, s = [int(_) for _ in inp.split(",")]
            except:
                die(border, f"The input you provided is not valid!")
            if verify(sign_id, msg, s):
                die(border, f"The signature is correct")
            else:
                die(border, f"The signature is incorrect")
        elif ans == "g":
            pr(border, "Please send the private key: ")
            _skey = sc().decode()
            try:
                _skey = int(_skey)
            except:
                die(border, "The private key is incorrect! Quitting...")
            if _skey == skey:
                die(border, f"Congrats, you got the flag: {flag}")
            else:
                die(border, f"The private key is incorrect! Quitting...")
        elif ans == "p":
            pr(border, f"pubkey = {pubkey}")
        elif ans == "q":
            die(border, "Quitting...")
        else:
            die(border, "Bye...")

if __name__ == "__main__":
    main()
```
  
## The Challenge  
We have a custom Elliptic curve based signing method where we have:  
$sig = k^{-1}(H(flag) + x.r)$  
Where $H()$ is the sha256 hash function.  And,  
$k = i + flag$ where $i$ is a positive input.  
$r = ((i+flag)*G)$'s $x$ value, where $G$ is the given generator.  
  
### Curve parameters:
```
p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
a, b = 0, 7
n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
x = 0x4F22E22228BD75086D77AE65174C000F132BFD4EF3E28BEF20AC476997D4444F
y = 0x3456B224247A4F73BF187AC25864F8F694C078380E6BDDF51379AC33F18BD829
G = (x, y)
```
  
The idea here is that the nonce, $k$ (and $r$) is related to the flag.  
$sig*(f+i) = H(f) + ((flag+i)[G])_x.x$  
  
### Available functions  
- **Sign Flag**:  
    - Sign *half* of the flag after entering the input **i**. (i>0)  
    - **i** must be a positive integer.  
    - This function can be called thrice per connection.  
- **Verify Sign**  
    - Input **i**, msg, signature and verify the signature.  
- **Public Key**  
    - Get public key, G\*x  
- **Get Flag**  
    - Submit the secret key to get the flag.  
  
The secret key is randomly generated each session.  
  
## Goal  
Get secret key, $x$ to get the flag using the `Get Flag` option.  
  
## Solve method
Sign the flag three times with 3 fixed inputs, I picked n-1, n, n+1 which corresponds to -1,0,1 modulo n.  
I now have the signatures:  
$s_1 = (f-1)^{-1}(H(f) + x.r_1)$  
$s_2 = f^{-1}(H(f) + x.r_2)$  
$s_3 = (f+1)^{-1}(H(f) + x.r_3)$  
  
If we can find $f$, we can find the secret key $x$ since $k$, $r$ are derived from $f$.  
The point is that the only parameter which does not depend on $f$ is $x$.  
Isolating and solving for $f$ would be sufficient with more equations.  
  
### Steps:  
- Connect three times, get three signatures each with -1, 0, 1 as input (total 9 signatures, 3 different secret keys).  
- Represent these signatures as polynomials and run Gröbner basis on them.  
- This will likely give us a univariate polynomial with just $f$.  
  
```python
ring  = PolynomialRing(Zmod(n),"f,hm,x1,x2,x3,r1,r2,r3")
f,hm,x1,x2,x3,r1,r2,r3 = ring.gens()

polys = []
skeys = [x1,x2,x3]

for i in range(3):
    io = process(["python3", "goliver_ii.py"])
    
    sigs = []
    for id_ in [n-1, n, n+1]:
        io.sendlineafter(b"[Q]uit", b"s")
        io.sendlineafter(b"Please provide sign_id:", str(id_).encode())
        io.recvuntil(b" = ")
        sig = int(io.recvline().decode().strip())
        sigs.append(sig)

    poly1 = sigs[0]*(f-1) - (hm + skeys[i]*r1)
    poly2 = sigs[1]*(f) - (hm + skeys[i]*r2)
    poly3 = sigs[2]*(f+1) - (hm + skeys[i]*r3)

    polys.extend([poly1, poly2, poly3])

I = Ideal(polys)
I = I.groebner_basis()
```
  
### Output of Gröbner basis  
Apart from a lot of polynomials with more than 2 or 3 variables, I got these two of interest.  
```
hm^2 + 51989013448949885539554618257102458248565713699031161692813212929127736938180*hm + 77082907859137322351577851900622043284162972380861088113945838271639047226019

f + 87873448267368069019265268056652001436818089329523303523997221102801902442766*hm + 82774698873696911536678520086342660469033844870178254485070366763474130114794
```
  
I solved for hm (hash of the flag) using `.roots()`.  
Substitute hm in the 2nd equation and find the roots again to get $f$ (which is only half of the flag)  
  
Now that I had the message used to sign, the signature itself, $k$ and $r$ which is $i + flag$ and $(G.k)_x$, I can calculate $x$ (For the $3^{rd}$ active connection since the first two are closed).  
  
Picking to solve using the $2^{nd}$ signature where input, **i** = n (effectively 0)  
$s_2 = k_2^{-1}(H(f) + r_2.x)$  
$s_2 = f^{-1}(H(f) + (G.f)_x.x)$  
$x = (s_2.f - H(f)).((G.f)_x)^{-1}$
  
```
b'\xe2\x94\x83 Congrats, you got the flag: CCTF{helloworld_my_name_is_goliver}\n'
```
  
## Note
- I couldn't solve this challenge during the ctf, so I solved it locally with a fake flag.py file.  
  
## solve.sage
```python
from pwn import process
from Crypto.Util.number import long_to_bytes

p = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEFFFFFC2F
a, b = 0, 7
n = 0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
x = 0x4F22E22228BD75086D77AE65174C000F132BFD4EF3E28BEF20AC476997D4444F
y = 0x3456B224247A4F73BF187AC25864F8F694C078380E6BDDF51379AC33F18BD829

E = EllipticCurve(GF(p),[a,b])
G = E(x, y)

ring  = PolynomialRing(Zmod(n),"f,hm,x1,x2,x3,r1,r2,r3")
f,hm,x1,x2,x3,r1,r2,r3 = ring.gens()

polys = []
skeys = [x1,x2,x3]

for i in range(3):
    io = process(["python3", "goliver_ii.py"])
    
    sigs = []
    for id_ in [n-1, n, n+1]:
        io.sendlineafter(b"[Q]uit", b"s")
        io.sendlineafter(b"Please provide sign_id:", str(id_).encode())
        io.recvuntil(b" = ")
        sig = int(io.recvline().decode().strip())
        sigs.append(sig)

    poly1 = sigs[0]*(f-1) - (hm + skeys[i]*r1)
    poly2 = sigs[1]*(f) - (hm + skeys[i]*r2)
    poly3 = sigs[2]*(f+1) - (hm + skeys[i]*r3)

    polys.extend([poly1, poly2, poly3])

I = Ideal(polys)
I = I.groebner_basis()

#observe outputs
"""
for eqns in I:
    print(eqns)
"""

R.<f> = PolynomialRing(Zmod(n))
S.<hm> = PolynomialRing(Zmod(n))

eqn1 = S(I[0]) # Has only hm terms
eqn2 = I[-3] # Has only f and hm terms

f = False
for hm_ in eqn1.roots():
    eqn2 = R(eqn2.substitute(hm = hm_[0]))
    for f_ in eqn2.roots():
        if long_to_bytes(int(f_[0])).startswith(b"CCTF{"):
            f_ = int(f_[0])
            hm_ = int(hm_[0])
            f = True
            break
    if f:
        break

r = int((G*f_).xy()[0])
secret = ((int(sigs[1])*f_ - hm_)*pow(r,-1,n))%n

io.sendlineafter(b"[Q]uit", b"g")
io.recvuntil(b"Please send the private key: ")
io.sendline(str(secret).encode())

for i in range(2):
    print(io.recvline())
```
