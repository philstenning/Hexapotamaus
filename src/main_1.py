# import sys
import time
import serial
import lewansoul_lx16a
import math

SERIAL_PORT = 'COM4'
# Motor id's
m_1 = 25
m_2 = 26
m_3 = 27

leg_1 = [m_1, m_2, m_3]

MOTOR_OFFSET = 100
MOTOR_DEG = (749)/180  # 4.16111r

# this is the maximum Positions of the
# the leg can reach.
# TODO: check this should be 235???
GRAPH_MAX_Y = 230
GRAPH_MAX_X = 230

##### Foot postitions #####
#  the vertical axis mm
foot_position_y = 250

# the horizontal axis mm
foot_position_x = 200
#########################

######## leg triangle ########
# this does not include the foot at the moment.
leg_triangle_r = 156.62
leg_triangle_s = 113.624
leg_triangle_t = 193.494  # => math.sqrt(leg_triangle_r**2 + leg_triangle_s**2)

print(leg_triangle_r, leg_triangle_s, leg_triangle_t)


#### base triangle ####
# this is needed to calculate unknown length of
# the side in the position triangle / base_triangle_r
base_triangle_s = foot_position_y-GRAPH_MAX_Y
base_triangle_t = foot_position_x
base_triangle_r = math.sqrt(base_triangle_s**2 + base_triangle_t**2)
print(base_triangle_r, base_triangle_s, base_triangle_t)

######  X Y position triangle ######

# this is the hypotenuse from the leg triangle.
position_triangle_r = leg_triangle_t
# motor 2 --> motor 3 distance between two
# center pivot points
position_triangle_s = 70
# calculated from base triangle.
position_triangle_t = base_triangle_r


def calc_angle_a(_side_a, _side_b, _side_c):
   # cos A = (b2 + c2 - a2) / 2bc
   # use the math.acos function, this is the inverse cosine function
   # it returns radians
    angle_A_radians = math.acos(
        (_side_b**2 + _side_c**2 - _side_a**2) / (2 * _side_b * _side_c))
    # convert to degrees and return
    return int(round(math.degrees(angle_A_radians)))


def calc_angle_c(_side_a, _side_b, _side_c):
    # cos C = (a2 + b2 - c2) / 2ab
    return calc_angle_a(_side_c, _side_b, _side_a)
    # this code is the same as doing it above.
    # angle_A_radians = math.acos(
    #     (_side_a**2 + _side_b**2 - _side_c**2) / (2 * _side_a * _side_b))
    # return math.degrees(angle_A_radians)


position_triangle_angle_A = calc_angle_a(
    position_triangle_r, position_triangle_s,  position_triangle_t)

position_triangle_angle_C = calc_angle_c(
    position_triangle_r, position_triangle_s,  position_triangle_t)

base_triangle_angle_C = calc_angle_c(
    base_triangle_r, base_triangle_s,  base_triangle_t)

print(position_triangle_angle_A, position_triangle_angle_C, base_triangle_angle_C)


motor_2_angle = 180 - (position_triangle_angle_A + base_triangle_angle_C)
# 36 is the angle of the foot triangle.
motor_3_angle = 360 - (position_triangle_angle_C + 36 + 90)

print(motor_2_angle, motor_3_angle)


def calPos(number):
    return math.floor(MOTOR_DEG * number + MOTOR_OFFSET)


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



#############################################################
# Set up motor controller.
ctrl = lewansoul_lx16a.ServoController(
    serial.Serial(SERIAL_PORT, 115200, timeout=1),
)

################################################################
# set_leg_position(leg_1, 1, 90, 32, 131)



print('motor positions --> m_2:', ctrl.get_position(m_2),
      ' m3: ', ctrl.get_position(m_3))

print('Done...')
