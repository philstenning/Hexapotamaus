# import sys
import time
import serial
import lewansoul_lx16a
import math

from legcalculations import calc_angle_a, calc_angle_c

#angle B  |\
#         | \
#  side s |  \   side r
#         |   \
# angle A |____\ angle C
#        side t

SERIAL_PORT = 'COM4'
# Motor id's
M_1 = 25
M_2 = 26
M_3 = 27

M_4 = 38
M_5 = 39
M_6 = 40

# ASSIGN MOTORS TO LEGS
LEG_1 = [M_1, M_2, M_3]
LEG_2 = [M_4, M_5, M_6]

# The motor arm in a straight line to body of motor
# was set to a value of 500, so 0 degrees is not
# at a value of 0 but around 100.  there will be
# a small difference in how the motor was calibrated
# so you will need to check each motor using the
# ctrl.get_position_offset(motor_id)
MOTOR_OFFSET = 100
MOTOR_DEG = (749)/180  # 4.16111r

# this is the maximum Positions that
# the leg can reach.
# TODO: check this should be 235???
GRAPH_MAX_Y = 230
GRAPH_MAX_X = 230

######## leg triangle ########
# this does not include the foot at the moment.
LEG_TRIANGLE_R = 156.62
LEG_TRIANGLE_S = 113.624
LEG_TRIANGLE_T = 193.494  # => math.sqrt(leg_triangle_r**2 + leg_triangle_s**2)

#### POSITION_TRIANGLE ####
# only the side S is known at start
# all others are calculated at runtime
# motor 2 --> motor 3 distance between two
# center pivot points
POSITION_TRIANGLE_S = 70


def calc_angles(foot_position_x, foot_position_y, foot_position_z=0):
    foot_position_y += GRAPH_MAX_Y
    if foot_position_y == 0:
        foot_position_y = 1
    #### base triangle ####
    # this is needed to calculate unknown length of
    # the side in the position triangle / base_triangle_r
    base_triangle_s = foot_position_y-GRAPH_MAX_Y
    base_triangle_t = foot_position_x
    base_triangle_r = math.sqrt(base_triangle_s**2 + base_triangle_t**2)
    # print(base_triangle_r, base_triangle_s, base_triangle_t)

    ######  X Y position triangle ######

    # this is the hypotenuse from the leg triangle.
    position_triangle_r = LEG_TRIANGLE_T

    # calculated from base triangle.
    position_triangle_t = base_triangle_r

    ####################################
    position_triangle_angle_A = calc_angle_a(
        position_triangle_r, POSITION_TRIANGLE_S,  position_triangle_t)

    position_triangle_angle_C = calc_angle_c(
        position_triangle_r, POSITION_TRIANGLE_S,  position_triangle_t)

    base_triangle_angle_C = calc_angle_c(
        base_triangle_r, base_triangle_s,  base_triangle_t)
    # print(position_triangle_angle_A, position_triangle_angle_C, base_triangle_angle_C)

    # calculate motor 1 angle
    motor_1_triangle_s = math.sqrt(foot_position_x**2 + foot_position_z**2)
    motor_1_angle = calculate_motor_1_angle(
        foot_position_x, motor_1_triangle_s, foot_position_z)

    motor_2_angle = 180 - (position_triangle_angle_A + base_triangle_angle_C)
    # 36 is the angle of the foot triangle.
    motor_3_angle = 360 - (position_triangle_angle_C + 36 + 90)

    # print(motor_2_angle, motor_3_angle)
    return motor_1_angle,  motor_2_angle, motor_3_angle


def calculate_motor_1_angle(triangle_side_r, triangle_side_s, triangle_side_t):
    # default is 90 degrees
    motor_1_angle = 90
    if triangle_side_t > 0:
        # print('---> foot_position_z:', foot_position_z)
       
        angle = calc_angle_a(
            triangle_side_r, triangle_side_s, triangle_side_t)
        motor_1_angle = 180 - angle
    elif triangle_side_t < 0:
        
        motor_1_angle = calc_angle_a(
            triangle_side_r, triangle_side_s, -triangle_side_t)
        print('res motor_1_angle:', motor_1_angle)
    return motor_1_angle


def calPos(number):
    return math.floor(MOTOR_DEG * number + MOTOR_OFFSET)


def set_motor_position(motor_id, angle=90, time_seconds=1):
    # quick set motor position
    # default angle is 90 degrees this should not bind on anything
    position = calPos(angle)
    # print('angle:', angle, ' Position:', position)
    transition_time = time_seconds * 1000
    ctrl.move(motor_id, position, transition_time)


def set_leg_position_by_angles(leg, transition_time=1, motor_1_position=90,
                               motor_2_position=90, motor_3_position=90):
    # shortcut for doing it with the set_motor_position function
    # but also add a time.sleep to make things cleaner.
    # TODO next line disabled for testing only
    # set_motor_position(let_id[0], motor_1_position, transition_time)
    set_motor_position(leg[1], motor_2_position, transition_time)
    set_motor_position(leg[2], motor_3_position, transition_time)

    time.sleep(transition_time)


def set_leg_position(leg, time_seconds, x, y, z=90):
    motor_angle_a, motor_angle_b, motor_angle_c = calc_angles(x, y)
    set_leg_position_by_angles(
        leg, time_seconds, motor_angle_a, motor_angle_b, motor_angle_c)


#############################################################
# Set up motor controller.
try:
    ctrl = lewansoul_lx16a.ServoController(
        serial.Serial(SERIAL_PORT, 115200, timeout=1),
    )
except:
    print("Could not connect to motor controller")
    # exit()


def set_leg_move_prepare(leg, transition_time=1, x=90, y=90, z=90):
    motor_angle_a, motor_angle_b, motor_angle_c = calc_angles(x, y)
    transition_time = transition_time * 1000
    ctrl.move_prepare(leg[0], calPos(z), transition_time)
    ctrl.move_prepare(leg[1], calPos(motor_angle_b), transition_time)
    ctrl.move_prepare(leg[2], calPos(motor_angle_c), transition_time)


def motors_move_start(transition_time=1):
    ctrl.move_start()
    time.sleep(transition_time)


################################################################
end = 220
start = 100
x = 100
t = 0.01
# set_leg_position(leg_2, 1, 150, 90)
# ctrl.set_position_offset(m_3, -10)
# limits = ctrl.get_position_offset(m_2)
# print(limits)
# limits = ctrl.get_position_offset(m_3)
# print(limits)
# limits = ctrl.get_position_offset(m_5)
# print(limits)
# limits = ctrl.get_position_offset(m_6)
# print(limits)
# print(ctrl.get_position_offset(m_4))
# print(ctrl.get_position_offset(m_5))
# print(ctrl.get_position_offset(m_6))
# set_leg_position_by_angles(leg_1, 1, 90, 91, 5)


# set_leg_position_by_angles(leg_1, 1, 90, 90, 0)
# set_leg_position_by_angles(leg_2, 1, 90, 90, 0)
# move_start()
# while 1:
#     for i in range(start, end, 2):
#         set_leg_position(leg_1, t, x, i)
#     for i in range(end, start, -2):
#         set_leg_position(leg_1, t, x, i)
# print(ctrl.get_servo_id())
# while 1:
#     set_leg_move_prepare(LEG_2, .5, 120, 120, 90)
#     motors_move_start(.5)
#     set_leg_move_prepare(LEG_1, .5, 120, 120, 90)
#     motors_move_start(.5)
#     # set_leg_move_prepare(leg_2, 1, 120, 120,70)
#     # motors_move_start()
#     set_leg_move_prepare(LEG_1, .5, 140, 10, 120)
#     motors_move_start(.5)
#     # set_leg_move_prepare(LEG_1, 1, 180, 10,180)
#     # motors_move_start()
#     set_leg_move_prepare(LEG_1, .5, 140, 120, 120)
#     motors_move_start(.5)
#     set_leg_move_prepare(LEG_1, .2, 140, 120, 120)
#     motors_move_start(.2)

#     # motors_move_start()
#     # set_leg_move_prepare(leg_2, 1, 120, 120,70)
#     # motors_move_start()
#     set_leg_move_prepare(LEG_2, .5, 140, 10, 120)
#     motors_move_start(.5)
#     # set_leg_move_prepare(leg_1, 1, 180, 10,180)
#     # motors_move_start()
#     set_leg_move_prepare(LEG_2, .5, 140, 120, 120)
#     motors_move_start(.5)
#     set_leg_move_prepare(LEG_2, .2, 140, 120, 120)
#     motors_move_start(.2)

# set_leg_move_prepare(leg_2, 1, 180, 10)
# while 1:
#     for i in range(100,200,10):
#         m2, m3 = calc_angles(i, 130)
#         set_leg_position_by_angles(leg_1, t, 90, m2, m3)
#     for i in range(200,100,-10):
#         m2, m3 = calc_angles(i, 130)
#         set_leg_position_by_angles(leg_1, t, 90, m2, m3)

# while 1:
#     for i in range(1,120):
#       m2, m3 = calc_angles(x, i)
#     #   print(m2, m3)
#       set_leg_position(leg_1, t, 90, m2, m3)

#     time.sleep(1)

#     for i in range(120,1,-1):
#       m2, m3 = calc_angles(x, i)
#     #   print(m2, m3)
#       set_leg_position(leg_1, t, 90, m2, m3)
#     time.sleep(1)

# print('motor positions --> m_2:', ctrl.get_position(m_2),
#       ' m3: ', ctrl.get_position(m_3))

print('Done...')
