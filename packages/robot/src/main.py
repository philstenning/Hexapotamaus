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

#  the vertical axis
side_vertical = 12

# the horizontal axis
side_horizontal = 180
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
# we just need the straight line length.
SIDE_A = 200

# Motor id's
m_1 = 25
m_2 = 26
m_3 = 27

leg_1 = [m_1, m_2, m_3]
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

#
MOTOR_2_OFFSET = 100
MOTOR_DEG = (749)/180  # 4.16111r

# temp = math.floor(180 - (angle_a + calc_angle_c(side_calculated,
#                                                 side_vertical, side_horizontal)))
# print('temp\:', temp)


def calPos(number):
    return math.floor(MOTOR_DEG * number + MOTOR_2_OFFSET) 

# quick set motor position
# default angle is 90 degrees this should not bind on anything


def set_motor_position(motor_id, angle=90, time_seconds=1):
    position = calPos(angle)
    transition_time = time_seconds * 1000
    ctrl.move(motor_id, position, transition_time)


def set_leg_position(let_id=leg_1, transition_time=1, motor_1_position=90,
                     motor_2_position=90, motor_3_position=90):
    # TODO next line disabled for testing only
    # set_motor_position(let_id[0], motor_1_position, transition_time)
    set_motor_position(let_id[1], motor_2_position, transition_time)
    set_motor_position(let_id[2], motor_3_position, transition_time)
    time.sleep(transition_time)


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

MOTOR_3_OFFSET = 36

motor_3_angle = 180 - angle_c + MOTOR_3_OFFSET + 90
print('motor_3_angle', motor_3_angle, ' deg')
motor_3_postition = math.floor(motor_3_angle * MOTOR_DEG)

# motor_3_postition = math.floor(angle_c * MOTOR_DEG)
# print('\nmotor offset_3: ', motor_3_postition)
######################################################


ctrl = lewansoul_lx16a.ServoController(
    serial.Serial(SERIAL_PORT, 115200, timeout=1),
)
# wait = 500
# w = 30


# keep for setting limits
min = 50
max = 889
# ctrl.set_position_limits(m_2, min, max)

# print('MOTOR 1 limits: ', ctrl.get_position_limits(m_1))
# ctrl.set_position_offset(m_3,-18)
# print('MOTOR 2 limits: ', ctrl.get_position_limits(m_2))
# print('MOTOR 2 offset: ', ctrl.get_position_offset(m_3))
# print('MOTOR 3 limits: ', ctrl.get_position_limits(m_3))
# print('MOTOR 3 offset: ', ctrl.get_position_offset(m_3))


# ctrl.move(m_2, calPos(90), 1000)

# setPosition(m_3, 55, 1)
set_leg_position(leg_1, 1, 90, motor_2_angle, motor_3_angle)
# set_leg_position(leg_1, 2, 90, 0, 0)

# ctrl.move(m_3, 500, 2000)

# time.sleep(2)
# ctrl.move(m_2, calPos(180), 2000)
# time.sleep(2)
# ctrl.move(m_2, calPos(0), 2000)
# time.sleep(2)
# ctrl.move(m_2, calPos(45), 2000)
# ctrl.move(m_3, calPos(0), 1000)
# time.sleep(1)
# ctrl.move(m_3, calPos(180), 2000)
# time.sleep(2)
# ctrl.move(m_3, calPos(90), 2000)
# time.sleep(2)
# ctrl.move(m_3, calPos(180), 2000)
# time.sleep(2)
# ctrl.move(m_3, calPos(90), 2000)
# time.sleep(2)
# print('\n\n')
# print(calPos(90))
# print(calPos(0))
# print(calPos(180))
print('motor positions --> m_2:', ctrl.get_position(m_2),
      ' m3: ', ctrl.get_position(m_3))
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
