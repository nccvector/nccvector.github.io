---
title: Laser Calibration 
author: vector
date: 2024-02-25 12:10:46 +0900
categories: roboticscalibration
pin: true
math: true
mermaid: true
---
Trying to find equations for laser calibration using sympy


```python
import numpy as np
import sympy as sm
import scipy.spatial.transform as transform
np.set_printoptions(suppress=True)
sm.init_printing()
```


```python
# AX = ZB
cardinalSymbols = ['x', 'y', 'z']

aSymbols = [sm.Symbol('a' + str(i)) for i in range(3 * 4)]
zpSymbols = [sm.Symbol('z_' + sym) for sym in cardinalSymbols]
xpSymbols = [sm.Symbol('x_' + sym) for sym in cardinalSymbols]
xdSymbols = [sm.Symbol('\hat{x}_' + sym) for sym in cardinalSymbols]
dSymbol = sm.Symbol('d')

# Creating matrices from symbols
symMatA = sm.Matrix([aSymbols[:4], aSymbols[4:8], aSymbols[8:12], [0, 0, 0, 1]])
symMatZp = sm.Matrix([zpSymbols[0], zpSymbols[1], zpSymbols[2], 1])
symMatXp = sm.Matrix([xpSymbols[0], xpSymbols[1], xpSymbols[2], 1])
symMatXd = sm.Matrix([xdSymbols[0], xdSymbols[1], xdSymbols[2], 0])

# Display symbols
display(symMatA)
display(symMatXp)
display(symMatXd)
display(symMatZp)
display(dSymbol)

matrixEquation = (symMatA * symMatXp + symMatA * symMatXd * dSymbol) - symMatZp
display('EQUATION:', matrixEquation)
```


$$\displaystyle \left[\begin{matrix}a_{0} & a_{1} & a_{2} & a_{3}\\a_{4} & a_{5} & a_{6} & a_{7}\\a_{8} & a_{9} & a_{10} & a_{11}\\0 & 0 & 0 & 1\end{matrix}\right]$$



$$\displaystyle \left[\begin{matrix}x_{x}\\x_{y}\\x_{z}\\1\end{matrix}\right]$$



$$\displaystyle \left[\begin{matrix}\hat{x}_x\\\hat{x}_y\\\hat{x}_z\\0\end{matrix}\right]$$



$$\displaystyle \left[\begin{matrix}z_{x}\\z_{y}\\z_{z}\\1\end{matrix}\right]$$



$\displaystyle d$



    'EQUATION:'



$$\displaystyle \left[\begin{matrix}a_{0} x_{x} + a_{1} x_{y} + a_{2} x_{z} + a_{3} + d \left(\hat{x}_x a_{0} + \hat{x}_y a_{1} + \hat{x}_z a_{2}\right) - z_{x}\\a_{4} x_{x} + a_{5} x_{y} + a_{6} x_{z} + a_{7} + d \left(\hat{x}_x a_{4} + \hat{x}_y a_{5} + \hat{x}_z a_{6}\right) - z_{y}\\a_{10} x_{z} + a_{11} + a_{8} x_{x} + a_{9} x_{y} + d \left(\hat{x}_x a_{8} + \hat{x}_y a_{9} + \hat{x}_z a_{10}\right) - z_{z}\\0\end{matrix}\right]$$



```python
leastsqMatA, leastsqMatb = sm.linear_eq_to_matrix(
    matrixEquation,
    [x for x in xpSymbols] + [x for x in xdSymbols] + [z for z in zpSymbols]    # <<< Unknowns
)

display(leastsqMatA)
display(leastsqMatb)
```


$$\displaystyle \left[\begin{matrix}a_{0} & a_{1} & a_{2} & a_{0} d & a_{1} d & a_{2} d & -1 & 0 & 0\\a_{4} & a_{5} & a_{6} & a_{4} d & a_{5} d & a_{6} d & 0 & -1 & 0\\a_{8} & a_{9} & a_{10} & a_{8} d & a_{9} d & a_{10} d & 0 & 0 & -1\\0 & 0 & 0 & 0 & 0 & 0 & 0 & 0 & 0\end{matrix}\right]$$



$$\displaystyle \left[\begin{matrix}- a_{3}\\- a_{7}\\- a_{11}\\0\end{matrix}\right]$$



```python
reducedLsqMatA = sm.Matrix(leastsqMatA[:3, :])
reducedLsqMatb = sm.Matrix(leastsqMatb[:3])

display(reducedLsqMatA)
display(reducedLsqMatb)
```


$$\displaystyle \left[\begin{matrix}a_{0} & a_{1} & a_{2} & a_{0} d & a_{1} d & a_{2} d & -1 & 0 & 0\\a_{4} & a_{5} & a_{6} & a_{4} d & a_{5} d & a_{6} d & 0 & -1 & 0\\a_{8} & a_{9} & a_{10} & a_{8} d & a_{9} d & a_{10} d & 0 & 0 & -1\end{matrix}\right]$$



$$\displaystyle \left[\begin{matrix}- a_{3}\\- a_{7}\\- a_{11}\end{matrix}\right]$$



```python
lhs = symMatA[:3, :3].row_join(symMatA[:3, :3] * dSymbol).row_join(-sm.eye(3))
rhs = -symMatA[:3, -1]

display(lhs)
display(rhs)
```


$$\displaystyle \left[\begin{matrix}a_{0} & a_{1} & a_{2} & a_{0} d & a_{1} d & a_{2} d & -1 & 0 & 0\\a_{4} & a_{5} & a_{6} & a_{4} d & a_{5} d & a_{6} d & 0 & -1 & 0\\a_{8} & a_{9} & a_{10} & a_{8} d & a_{9} d & a_{10} d & 0 & 0 & -1\end{matrix}\right]$$



$$\displaystyle \left[\begin{matrix}- a_{3}\\- a_{7}\\- a_{11}\end{matrix}\right]$$



```python
lhs == reducedLsqMatA
```




    True




```python
Ra = sm.MatrixSymbol('R_a', 3, 3)
ta = sm.MatrixSymbol('t_a', 3, 1)
I3 = sm.MatrixSymbol('I_3', 3, 3)
xpVec = sm.MatrixSymbol('x_{3, 1}', 3, 1)
xdVec = sm.MatrixSymbol('\hat{x}_{3, 1}', 3, 1)
zpVec = sm.MatrixSymbol('z_{3, 1}', 3, 1)

cuteEquationLHS = sm.BlockMatrix([
    Ra,
    Ra * dSymbol,
    -I3
]) * sm.BlockMatrix([
    [xpVec],
    [xdVec],
    [zpVec]
])


cuteEquationRHS = -ta

cuteEquation = sm.Eq(cuteEquationLHS, cuteEquationRHS)

display(cuteEquation)
```


$$\displaystyle \left[\begin{matrix}R_{a} & d R_{a} & - I_{3}\end{matrix}\right] \left[\begin{matrix}x_{3, 1}\\\hat{x}_{3, 1}\\z_{3, 1}\end{matrix}\right] = - t_{a}$$

