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

#  the vertical axis mm
side_vertical = 1

# the horizontal axis mm
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


def calc_angle_a(_side_a, _side_b, _side_c):
   # cos A = (b2 + c2 - a2) / 2bc
   # use the math.acos function, this is the inverse cosine function
   # it returns radians
    angle_A_radians = math.acos(
        (_side_b**2 + _side_c**2 - _side_a**2) / (2 * _side_b * _side_c))
    # convert to degrees and return
    return math.degrees(angle_A_radians)


def calc_angle_c(_side_a, _side_b, _side_c):
    # cos C = (a2 + b2 - c2) / 2ab
    return calc_angle_a(_side_c, _side_b, _side_a)
    # this code is the same as doing it above.
    # angle_A_radians = math.acos(
    #     (_side_a**2 + _side_b**2 - _side_c**2) / (2 * _side_a * _side_b))
    # return math.degrees(angle_A_radians)


angle_a = calc_angle_a(SIDE_A, SIDE_B,  side_calculated)
angle_c = calc_angle_c(SIDE_A, SIDE_B, side_calculated)
angle_b = 180 - (angle_a + angle_c)
print('angle a ', angle_a)
print('angle c ', angle_c)
print('angle b ', angle_b)


MOTOR_2_OFFSET = 100
MOTOR_DEG = (749)/180  # 4.16111r


def calPos(number):
    return math.floor(MOTOR_DEG * number + MOTOR_2_OFFSET)


def set_motor_position(motor_id, angle=90, time_seconds=1):
    # quick set motor position
    # default angle is 90 degrees this should not bind on anything
    position = calPos(angle)
    print('angle:', angle, ' Position:', position)
    transition_time = time_seconds * 1000
    ctrl.move(motor_id, position, transition_time)


def set_leg_position(let_id=leg_1, transition_time=1, motor_1_position=90,
                     motor_2_position=90, motor_3_position=90):
    # shortcut for doing it with the set_motor_position function
    # but also add a time.sleep to make things cleaner.
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

#############################################################
# Set up motor controller.
ctrl = lewansoul_lx16a.ServoController(
    serial.Serial(SERIAL_PORT, 115200, timeout=1),
)

################################################################
# set_leg_position(leg_1, 1, 90, 32, 131)
# set_leg_position(leg_1, 1, 90, 52, 124)
# set_leg_position(leg_1, 1, 90, 111, 97)

# set_leg_position(leg_1, 1, 90, 95, 136)
# set_leg_position(leg_1, 1, 90, 70, 123)
while 1:
    set_leg_position(leg_1, 1, 90, 0, 166)  # h:95 v: 137
    # time.sleep(2)e
    set_leg_position(leg_1, .5, 90, 168, 67)  # h:95 v: 137
    set_leg_position(leg_1, 1, 90, 0, -20)  # h:95 v: 137


print('motor positions --> m_2:', ctrl.get_position(m_2),
      ' m3: ', ctrl.get_position(m_3))

print('Done...')
