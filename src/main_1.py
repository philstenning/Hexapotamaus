# import sys
import time
import serial
import lewansoul_lx16a
import math
from inspect import currentframe, getframeinfo

from legcalculations import calPos, calc_angles

cf = currentframe()
filename = getframeinfo(cf).filename

# angle B |\
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


try:
    ctrl = lewansoul_lx16a.ServoController(
        serial.Serial(SERIAL_PORT, 115200, timeout=1),
    )
except:
    print("Could not connect to motor controller. at line:",
          cf.f_lineno)
    # exit()


def set_motor_position(motor_id, angle=90, time_seconds=1):
    # quick set motor position
    # default angle is 90 degrees this should not bind on anything
    position = calPos(angle)
    # print('angle:', angle, ' Position:', position)
    transition_time = time_seconds * 1000
    try:
        ctrl.move(motor_id, position, transition_time)
    except:
        print("Could not move motor:", motor_id,
              filename, '@line:', cf.f_lineno)


def set_leg_position_by_angles(leg, transition_time=1, motor_1_position=90,
                               motor_2_position=90, motor_3_position=90):
    # shortcut for doing it with the set_motor_position function
    # but also add a time.sleep to make things cleaner.
    # TODO next line disabled for testing only
    set_motor_position(leg[0], motor_1_position, transition_time)
    set_motor_position(leg[1], motor_2_position, transition_time)
    set_motor_position(leg[2], motor_3_position, transition_time)

    time.sleep(transition_time)


def set_leg_position(leg, time_seconds, x, y, z=90):
    motor_angle_a, motor_angle_b, motor_angle_c = calc_angles(x, y, z)
    set_leg_position_by_angles(
        leg, time_seconds, motor_angle_a, motor_angle_b, motor_angle_c)


def set_leg_position_prepare(leg, transition_time=1, x=90, y=90, z=90):
    motor_angle_a, motor_angle_b, motor_angle_c = calc_angles(x, y)
    transition_time = transition_time * 1000
    try:
        ctrl.move_prepare(leg[0], calPos(motor_angle_a), transition_time)
        ctrl.move_prepare(leg[1], calPos(motor_angle_b), transition_time)
        ctrl.move_prepare(leg[2], calPos(motor_angle_c), transition_time)
    except:
        print("Could not move motor", cf.f_lineno)


def motors_move_start(transition_time=1):
    try:
        ctrl.move_start()
        time.sleep(transition_time)
    except:
        print("Could not move motors", cf.f_lineno)


def print_leg_motor_positions(leg, name):
    print('motor positions for leg', name, ' --> motor 1:', ctrl.get_position(leg[0]),
          ' motor 2: ', ctrl.get_position(leg[1]), ' motor 3: ', ctrl.get_position(leg[2]),)


def print_leg_motor_offsets(leg, name):
    print('motor offsets for leg', name, ' --> motor 1:', ctrl.get_position_offset(leg[0]),

          ' motor 2: ', ctrl.get_position_offset(leg[1]), ' motor 3: ', ctrl.get_position_offset(leg[2]),)


def adjust_leg_offsets(leg, motor_1_dif, motor_2_dif, motor_3_dif):
    m1 = ctrl.get_position_offset(leg[0])
    m2 = ctrl.get_position_offset(leg[1])
    m3 = ctrl.get_position_offset(leg[2])
    print('before --> motor 1:', m1, ' motor 2:', m2, ' motor 3:', m3)
    ctrl.set_position_offset(leg[0], m1 + motor_1_dif)
    ctrl.set_position_offset(leg[1], m2 + motor_2_dif)
    ctrl.set_position_offset(leg[2], m3 + motor_3_dif)
    m1 = ctrl.get_position_offset(leg[0])
    m2 = ctrl.get_position_offset(leg[1])
    m3 = ctrl.get_position_offset(leg[2])
    print('after --> motor 1:', m1, ' motor 2:', m2, ' motor 3:', m3)


################################################################
start = 0
end = 150
x = 100
t = 0.05
step = 6


def move():
    # adjust_leg_offsets(LEG_2, 0, 0, -10)
    # print('nothing here yet', cf.f_lineno)
    # set_leg_position(LEG_2, 1, 140, 100, -70)
    # set_leg_position(LEG_1, 1, 150, 100, 70)

    # set_leg_position(LEG_2, 1, 100, 100, 0)
    # set_leg_position(LEG_1, 1, 100, 100, 0)
    # set_leg_position(LEG_2, 1, 140, 145, 0)
    # set_leg_position(LEG_1, 1, 140, 145, 0)
    # set_leg_position(LEG_2, 1, 30, 180, 0)
    # set_leg_position(LEG_1, 1, 30, 180, 0)
    # set_leg_position(LEG_2, 1, 180, 150, 0)
    set_leg_position(LEG_2, 1, 130, 100, 0)
    # while True:
    #     # set_leg_position_prepare(LEG_2, 1, 30, 120, 0)
    #     # set_leg_position_prepare(LEG_1, 1, 30, 120, 0)
    #     # motors_move_start(1)
    #     # set_leg_position_prepare(LEG_2, 1, 30, 200, 0)
    #     # set_leg_position_prepare(LEG_1, 1, 30, 200, 0)
    #     # motors_move_start(1)
    #     set_leg_position_prepare(LEG_2, 1, 160, 1, 0)
    #     set_leg_position_prepare(LEG_1, 1, 160, 1, 0)
    #     motors_move_start(1)
    # # time.sleep(1)

    # print_leg_motor_positions(LEG_1, 'LEG_1')
    # print_leg_motor_positions(LEG_2, 'LEG_2')

    # print_leg_motor_offsets(LEG_1, 'LEG_1')
    # print_leg_motor_offsets(LEG_2, 'LEG_2')

# while True:
#     for i in range(start, end, step):
#         # print(i)
#         set_leg_position(LEG_1, t, 120, 100, i)
#         # time.sleep(t)
#     for i in range(end, start, -step):
#         # print(i)
#         set_leg_position(LEG_1, t, 120, 100, i)
#         # time.sleep(t)

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

def main():
    #    init()
    move()


if __name__ == '__main__':
    main()
print('Done...')
