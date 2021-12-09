import time
import serial
import lewansoul_lx16a
import logging

from inspect import currentframe, getframeinfo
from settings import load_settings
from leg_calculations_2 import *

logging.basicConfig(filename='debug.log',
                    encoding='utf-8', level=logging.DEBUG)
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

M_7 = 9
M_8 = 10
M_9 = 11

M_10 = 1
M_11 = 2
M_12 = 3

M_13 = 17
M_14 = 18
M_15 = 43

M_16 = 34
M_17 = 33
M_18 = 35


# ASSIGN MOTORS TO LEGS
LEG_1 = [M_1, M_2, M_3]
LEG_2 = [M_4, M_5, M_6]
LEG_3 = [M_7, M_8, M_9]
LEG_4 = [M_13, M_14, M_15]
LEG_5 = [M_16, M_17, M_18]
LEG_6 = [M_10, M_11, M_12]

LEGS = [LEG_1, LEG_2, LEG_3, LEG_4, LEG_5, LEG_6]





leg_offsets = load_settings()['legOffsets']


try:
    lewansoul_lx16a.init()
    ctrl = lewansoul_lx16a.ServoController(
        serial.Serial(SERIAL_PORT, 115200, timeout=1),
    )
    print('Connected to:', SERIAL_PORT)

except:
    print("Could not connect to motor controller. at line:",
          cf.f_lineno)
# exit()


# print(ctrl)

#! moved
def set_motor_position(motor_id, angle, time_seconds=1):
    """
    Set the position of a motor
    """
    transition_time = time_seconds * 1000  # we need ms
    motor_position = calc_motor_position(angle)
    try:
        ctrl.move(motor_id, motor_position, transition_time)
        # print('motor_id:', motor_id, 'motor_position:', motor_position)
    except:
        print("Could not move motor:", motor_id,
              filename, '@line:', cf.f_lineno)
        # exit()

#! moved
def set_leg_position_by_angles(leg, angles, time_seconds=1):
    """
    Set the position of a leg
    @param leg: leg to set
    @param angles: [motor1, motor2, motor3] angles in degrees
    @param time_seconds: time to move in seconds
    """
    for i in range(3):
        set_motor_position(leg[i], angles[i], time_seconds)
    time.sleep(time_seconds)

#! moved
def set_leg_position(leg, time_seconds, x, y, z):
    """
    Set the position of a leg
    """
    angles = calculate_angles(x, y, z)
    print('angles', angles)
    set_leg_position_by_angles(leg, angles, time_seconds)

#! moved
def get_leg_position(leg):
    """
    Get the position of a leg
    """
    angles = []
    for i in range(3):
        angles.append(ctrl.get_position(leg[i]))
    print('current angles for leg:', angles)
    return angles

#! moved
def get_motor_settings(motor_id):
    offset = ctrl.get_position_offset(motor_id)
    position = ctrl.get_position(motor_id)
    print('motor_id:', motor_id, 'offset:', offset, 'position:', position)

#! moved
def reset_motor_offset(motor):
    print(ctrl.get_position(motor))
    print(ctrl.get_position_offset(motor))

    ctrl.set_position_offset(motor, 0)
    ctrl.move(motor, 500, 1000)
    print(ctrl.get_position(motor))
    # exit()


def get_leg_settings():
    for a in range(6):
        motor_offsets = []
        motor_positions = []

        for i in range(3):
            current_leg = LEGS[a]
            offset = ctrl.get_position_offset(current_leg[i])
            position = ctrl.get_position(current_leg[i]) + offset
            motor_positions.append(position)
            motor_offsets.append(offset)

        print('Leg:', a+1, 'Positions:[', motor_positions[0], ',',  motor_positions[1], ',',
              motor_positions[2], ']  Offsets:[', motor_offsets[0], ',',  motor_offsets[1], ',',  motor_offsets[2], ']',
              '     ', motor_positions[0] - motor_offsets[0], motor_positions[1] -
              motor_offsets[1], motor_positions[2] - motor_offsets[2])


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


def set_all_leg_offsets(leg_offsets=leg_offsets):
    for leg in range(6):

        for motor in range(3):
            ctrl.set_position_offset(LEGS[leg][motor], leg_offsets[leg][motor])
            # ctrl.save_position_offset(LEGS[leg][motor])

# set_all_leg_offsets()
# get_leg_settings()


def start_movement():
    """
    Start movement
    """
    try:

        X = 120
        Y = 156
        Y2 = 200
        Z = 0
        NZ = -Z

        m3p = 90
        set_leg_position(LEG_1, 1, X, Y, Z)
        set_leg_position(LEG_2, 1, X, Y2, Z)
        set_leg_position(LEG_3, 1, X, Y, Z)

        set_leg_position(LEG_4, 1, X, Y2, -Z)
        set_leg_position(LEG_5, 1, X, Y, -Z)
        set_leg_position(LEG_6, 1, X, Y2, -Z)
        # set_leg_position_by_angles(LEG_1, [90, 90, m3p], 1)
        # set_leg_position_by_angles(LEG_2, [90, 90, m3p], 1)
        # set_leg_position_by_angles(LEG_3, [90, 90, m3p], 1)
        # set_leg_position_by_angles(LEG_4, [90, 90, m3p], 1)
        # set_leg_position_by_angles(LEG_5, [90, 90, m3p], 1)
        # set_leg_position_by_angles(LEG_6, [90, 90, m3p], 1)

        # # adjust_leg_offsets(LEG_6, 0, 0, 0)
        # reset_motor_offset(LEG_4[1])

    except:
        print("Could not start movement. at line:",
              cf.f_lineno, filename)


# def main():

#     start_movement()


# if __name__ == '__main__':
#     pass
    # main()

# print('Done...')


# get_leg_position(LEG_1)
# set_leg_position(LEG_1, 1, 180, 100, 1)
# get_leg_position(LEG_1)
# set_leg_position_by_angles(LEG_1, [88, 44, 204], 1)  # 180, 120, 6
# set_leg_position_by_angles(LEG_1, [88, 16, 222], 1)  # 180, 100, 6
# set_leg_position_by_angles(LEG_1, [117, 114, 93], 1)  # 200, 200,100
# set_leg_position_by_angles(LEG_1, [130, 96, 138], 1)  # 120, 200,100
# # set_leg_position_by_angles(LEG_1, [141, 99, 147], 1)  # 80, 200,100
# set_leg_position_by_angles(LEG_1, [149, 103, 148], 1)  # 60, 200,100
#    while True:
# set_leg_position_by_angles(LEG_1, [90, 61, 126], 1)  # 250, 100,1
# set_leg_position_by_angles(LEG_1, [90, 33, 165], 1)  # 200, 100,1
# set_leg_position_by_angles(LEG_1, [90, -19, 221], 1)  # 130, 100,1
# set_leg_position_by_angles(LEG_1, [90, 96, 135], 1)  # 130, 200,1
# set_leg_position_by_angles(LEG_1, [85, 44, 151], 1)  # 200, 1,1
# set_leg_position_by_angles(LEG_1, [120, 13, 168], 1)  # 200, 1,1
# set_leg_position_by_angles(LEG_2, [90, 13, 168], 1)  # 200, 1,1
# set_leg_position_by_angles(LEG_2, [120, 13, 168], 1)  # 200, 1,1
# calculate_angles(220,50,1)
# calculate_angles(220,150,1)
# print(calculate_triangle_alpha(220, 1))
# print(calculate_triangle_alpha(220, 100))
# print(calculate_triangle_alpha(220,0))
# print(calculate_triangle_alpha(100,20))
# print('result:', calculate_angles(220, 100, 23))
