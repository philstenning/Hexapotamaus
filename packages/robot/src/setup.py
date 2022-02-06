import serial
import lewansoul_lx16a
from basic_movement import Motor, Leg

from inspect import currentframe, getframeinfo
cf = currentframe()
filename = getframeinfo(cf).filename

SERIAL_PORT = 'COM4'

try:
    controller = lewansoul_lx16a.ServoController(
        serial.Serial(SERIAL_PORT, 115200, timeout=1),
    )
except:
    print("Could not connect to motor controller. at line:",
          cf.f_lineno, filename)

motor_1 = Motor(controller, 25)
motor_2 = Motor(controller, 26)
motor_3 = Motor(controller, 27)

motor_4 = Motor(controller, 38)
motor_5 = Motor(controller, 39)
motor_6 = Motor(controller, 40)

motor_7 = Motor(controller, 9)
motor_8 = Motor(controller, 10)
motor_9 = Motor(controller, 11)

motor_10 = Motor(controller, 1)
motor_11 = Motor(controller, 2)
motor_12 = Motor(controller, 3)

motor_13 = Motor(controller, 17)
motor_14 = Motor(controller, 18)
motor_15 = Motor(controller, 43)

motor_16 = Motor(controller, 34)
motor_17 = Motor(controller, 33)
motor_18 = Motor(controller, 35)

leg_1 = Leg(controller, motor_1, motor_2, motor_3)
leg_2 = Leg(controller, motor_4, motor_5, motor_6)
leg_3 = Leg(controller, motor_7, motor_8, motor_9)
leg_4 = Leg(controller, motor_10, motor_11, motor_12)
leg_5 = Leg(controller, motor_13, motor_14, motor_15)
leg_6 = Leg(controller, motor_16, motor_17, motor_18)


# def main():
#     print('working')


# if __name__ == '__main__':
#     main()
