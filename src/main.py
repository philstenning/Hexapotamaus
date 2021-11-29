# import sys
import time
import serial
import lewansoul_lx16a
import math


# SERIAL_PORT = '/dev/ttyUSB0'
SERIAL_PORT = 'COM4'


#       |  side_c
# side_v|_____
#       side_h
#

# side_v is the vertical axis
side_vertical = 120


# side_h is horizontal axis
side_horizontal = 199
# side_c is the fist side we need to calculate.
# using pythagoras
# v2 * h2 = c2
side_calculated = math.sqrt(side_vertical**2 + side_horizontal**2)
print('side_calculated length: ', side_calculated)

# We now need to work out the angles of the motor
# We know the length of all sides of the triangle
# by measuring the center rotational point of the motor
# and to the tip of the foot of the leg.

# motor 2 --> motor 3 distance between two
# center pivot point
SIDE_B = 70
# motor 3 center pivot point --> tip of foot
# any  bend in the leg is irrelevant
# we just need the streight line length.
SIDE_A = 200


# print(side_b**2)
# print(side_c**2)
# print(side_a**2)

# cos A = (b2 + c2 - a2) / 2bc
def calc_angle_a(_side_a, _side_b, _side_c):
   # use the math.acos function, this is the inverse cosine function
   # it returns radians
    angle_A_radians = math.acos(
        (_side_b**2 + _side_c**2 - _side_a**2) / (2 * _side_b * _side_c))
    # convert to degrees and return
    return math.degrees(angle_A_radians)


# cos C = (a2 + b2 - c2) / 2ab
def calc_angle_c(_side_a, _side_b, _side_c):
    return calc_angle_a(_side_c, _side_b, _side_a)
    # angle_A_radians = math.acos(
    #     (_side_a**2 + _side_b**2 - _side_c**2) / (2 * _side_a * _side_b))
    # return math.degrees(angle_A_radians)


angle_a = calc_angle_a(SIDE_A, SIDE_B,  side_calculated)
angle_c = calc_angle_c(SIDE_A, SIDE_B, side_calculated)
angle_b = 180 - (angle_a + angle_c)
print('angle a ', angle_a)
print('angle c ', angle_c)
print('angle b ', angle_b)

# motor has 240 degrees of rotation
# this is divided by 1000 by it's diver.
# 0 is top 1000 is bottom
MOTOR_DEG = 1000/240  # 4.16666r

# temp = math.floor(180 - (angle_a + calc_angle_c(side_calculated,
#                                                 side_vertical, side_horizontal)))
# print('temp\:', temp)

# calculate angel with trig
base_angel_b = math.degrees(math.atan(side_vertical/side_horizontal))

# calculate angle c of base triangle
base_angel_c = 180 - (base_angel_b + 90)
print('base angel c', base_angel_c)

# we have both angles calculate the remainder.
motor_2_angle = 180 - (base_angel_c + angle_a)
print('\nmotor_2_angle: ', motor_2_angle)

# calculate motor position
motor_2_postition = math.floor(motor_2_angle * MOTOR_DEG)
print('motor postition: ', motor_2_postition)

MOTOR_3_OFFSET = -36
motor_3_angle = 360 - angle_c + MOTOR_3_OFFSET - 90
print('motor_3_angle', motor_3_angle, ' deg')
motor_3_postition = math.floor(motor_3_angle * MOTOR_DEG)

# motor_3_postition = math.floor(angle_c * MOTOR_DEG)
print('\nmotor offset_3: ', motor_3_postition)
######################################################


ctrl = lewansoul_lx16a.ServoController(
    serial.Serial(SERIAL_PORT, 115200, timeout=1),
)
# wait = 500
# w = 30
m_1 = 25
m_2 = 26
m_3 = 27

min = 50
max = 889
# ctrl.set_position_limits(m_2, min, max)

print('MOTOR 2 limits: ', ctrl.get_position_limits(m_2))

# print('MOTOR 3 limits: ', ctrl.get_position_limits(m_3))
ctrl.move(m_2, motor_2_postition, 2000)
ctrl.move(m_3, motor_3_postition, 2000)

time.sleep(2)
# ctrl.move(m_3, max, 2000)
# time.sleep(2)
# ctrl.move(m_2,100 ,1000)
# time.sleep(1)


# sv1 = ctrl.servo(25)
# sv2 = ctrl.servo(26)
# sv3 = ctrl.servo(27)

# c = ctrl.get_servo_id()
# print(c)

# ctrl.move(sv_1_1,500,wait)
# ctrl.move(sv_1_2,500,wait)
# ctrl.move(sv_1_3,500,wait)
# sv1.move_prepare(500, 1000)
# sv2.move_prepare(500, 1000)
# sv3.move_prepare(500, 1000)
# ctrl.move_start()
# time.sleep(1)

# sv1.move_prepare(500, 1000)
# sv2.move_prepare(100, 1000)
# sv3.move_prepare(900, 1000)
# ctrl.move_start()
# time.sleep(1)
# while True:

#     ctrl.move(sv_1_1, 400, 1000)
#     ctrl.move(sv_1_2, 400, 1000)
#     ctrl.move(sv_1_3, 400, 1000)
#     time.sleep(1)
#     d = 400
#     while d < 600:
#         ctrl.move(sv_1_1, d, w)
#         ctrl.move(sv_1_2, d, w)
#         ctrl.move(sv_1_3, d, w)
#         d += 10
#         time.sleep(w/1000)
print('Done...')
