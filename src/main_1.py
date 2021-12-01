# import sys
import time
import serial
import lewansoul_lx16a
import math

from legcalculations import calc_angle_a, calc_angle_c

SERIAL_PORT = 'COM4'
# Motor id's
m_1 = 25
m_2 = 26
m_3 = 27

m_4 = 38
m_5 = 39
m_6 = 40

leg_2 = [m_4, m_5, m_6]

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
# foot_position_y = 250

# the horizontal axis mm
# foot_position_x = 200
#########################

######## leg triangle ########
# this does not include the foot at the moment.
leg_triangle_r = 156.62
leg_triangle_s = 113.624
leg_triangle_t = 193.494  # => math.sqrt(leg_triangle_r**2 + leg_triangle_s**2)

# print(leg_triangle_r, leg_triangle_s, leg_triangle_t)


def calc_angles(foot_position_x, foot_position_y):
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
    position_triangle_r = leg_triangle_t
    # motor 2 --> motor 3 distance between two
    # center pivot points
    position_triangle_s = 70
    # calculated from base triangle.
    position_triangle_t = base_triangle_r

    ####################################
    position_triangle_angle_A = calc_angle_a(
        position_triangle_r, position_triangle_s,  position_triangle_t)

    position_triangle_angle_C = calc_angle_c(
        position_triangle_r, position_triangle_s,  position_triangle_t)

    base_triangle_angle_C = calc_angle_c(
        base_triangle_r, base_triangle_s,  base_triangle_t)

    # print(position_triangle_angle_A, position_triangle_angle_C, base_triangle_angle_C)
    motor_1_angle = 90
    motor_2_angle = 180 - (position_triangle_angle_A + base_triangle_angle_C)
    # 36 is the angle of the foot triangle.
    motor_3_angle = 360 - (position_triangle_angle_C + 36 + 90)

    # print(motor_2_angle, motor_3_angle)
    return motor_1_angle,  motor_2_angle, motor_3_angle


def calPos(number):
    return math.floor(MOTOR_DEG * number + MOTOR_OFFSET)


def set_motor_position(motor_id, angle=90, time_seconds=1):
    # quick set motor position
    # default angle is 90 degrees this should not bind on anything
    position = calPos(angle)
    # print('angle:', angle, ' Position:', position)
    transition_time = time_seconds * 1000
    ctrl.move(motor_id, position, transition_time)


def set_leg_position_by_angles(leg_id=leg_1, transition_time=1, motor_1_position=90,
                               motor_2_position=90, motor_3_position=90):
    # shortcut for doing it with the set_motor_position function
    # but also add a time.sleep to make things cleaner.
    # TODO next line disabled for testing only
    # set_motor_position(let_id[0], motor_1_position, transition_time)
    set_motor_position(leg_id[1], motor_2_position, transition_time)
    set_motor_position(leg_id[2], motor_3_position, transition_time)

    time.sleep(transition_time)


def set_leg_position(leg, time_seconds, x, y, z=90):
    motor_angle_a, motor_angle_b, motor_angle_c = calc_angles(x, y)
    set_leg_position_by_angles(
        leg, time_seconds, motor_angle_a, motor_angle_b, motor_angle_c)


#############################################################
# Set up motor controller.
ctrl = lewansoul_lx16a.ServoController(
    serial.Serial(SERIAL_PORT, 115200, timeout=1),
)


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
while 1:
    set_leg_move_prepare(leg_2, .5, 120, 120,90)
    motors_move_start(.5)
    set_leg_move_prepare(leg_1, .5, 120, 120,90)
    motors_move_start(.5)
    # set_leg_move_prepare(leg_2, 1, 120, 120,70)
    # motors_move_start()
    set_leg_move_prepare(leg_1, .5, 140, 10,120)
    motors_move_start(.5)
    # set_leg_move_prepare(leg_1, 1, 180, 10,180)
    # motors_move_start()
    set_leg_move_prepare(leg_1, .5, 140, 120,120)
    motors_move_start(.5)
    set_leg_move_prepare(leg_1, .2, 140, 120,120)
    motors_move_start(.2)

    # motors_move_start()
    # set_leg_move_prepare(leg_2, 1, 120, 120,70)
    # motors_move_start()
    set_leg_move_prepare(leg_2, .5, 140, 10,120)
    motors_move_start(.5)
    # set_leg_move_prepare(leg_1, 1, 180, 10,180)
    # motors_move_start()
    set_leg_move_prepare(leg_2, .5, 140, 120,120)
    motors_move_start(.5)
    set_leg_move_prepare(leg_2, .2, 140, 120,120)
    motors_move_start(.2)

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
