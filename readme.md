# Hexapotamaus

A pink six-legged robot, built using inverse kinematics in python.

![main image](images/PXL_20211211_112616037.jpg)

## Bus servo
The servos used in this robot:

https://www.hiwonder.com/store/learn/26.html
https://drive.google.com/drive/folders/1Hyk9LERYsAV_pSeEv5jMgaLblkSN4Xpn

## Vendor files (not in git)

The manufacturer's LX-16A download (manuals, protocol PDFs, Arduino/STM32/51 sample code, Windows tools)
and the CH341 USB-serial driver (`ch341ser.exe`, for the servo debug board) are no longer tracked in git.
They live in `vendor-archive/` locally (gitignored) and are archived at:

**Archive location:** _TODO: add the OneDrive link/path here_

The key documents to keep handy are the _LX-16A Serial Bus Servo User Manual_ and the
_Hiwonder Bus Servo Communication Protocol_ PDFs. The Python servo library we actually use
is still in git at `packages/robot/LewanSoul/` (from [maximkulkin/lewansoul-lx16a](https://github.com/maximkulkin/lewansoul-lx16a)).

Note: these files are still in older git history, so the repo's `.git` folder stays large unless history is rewritten.

## Useful links
[examples](https://www.instructables.com/How-to-Configure-and-Use-Smart-Servos-LewanSoul-LX/)
https://www.youtube.com/watch?v=M71dl8aHCI0&list=PLQYW5Ukp-1D-amIge4qTAPyu934yNjoPy&ab_channel=HiwonderRobot

[algebra  ](https://www.mathsisfun.com/algebra/trig-solving-sss-triangles.html)  

[motor](https://www.hiwonder.hk/collections/servo/products/hiwonder-lx-16a-full-metal-gear-serial-bus-servo)

[connector](https://www.molex.com/molex/products/family/minispox)

## Licence

MIT. See [LICENSE](LICENSE). This covers the code, CAD and documentation.

Exception: `packages/robot/LewanSoul/` is third-party code under GPLv3 and keeps that licence. It is planned to be replaced by our own LX-16A driver.
