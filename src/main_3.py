import time
import serial
import lewansoul_lx16a
from inspect import currentframe, getframeinfo

from leg_calculations_2 import *


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


def set_motor_position(motor_id, angle, time_seconds=1):
    """
    Set the position of a motor
    """
    transition_time = time_seconds * 1000  # we need ms
    motor_position = calc_motor_position(angle)
    try:
        ctrl.move(motor_id, motor_position, transition_time)
        print('motor_id:', motor_id, 'motor_position:', motor_position)
    except:
        print("Could not move motor:", motor_id,
              filename, '@line:', cf.f_lineno)
        # exit()


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


def set_leg_position(leg, time_seconds, x, y, z):
    """
    Set the position of a leg
    """
    angles = calculate_angles(x, y, z)
    print('angles', angles)
    set_leg_position_by_angles(leg, angles, time_seconds)


def get_leg_position(leg):
    """
    Get the position of a leg
    """
    angles = []
    for i in range(3):
        angles.append(ctrl.get_position(leg[i]))
    print('current angles for leg:', angles)
    return angles


def start_movement():
    """
    Start movement
    """
    try:
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
        print(calculate_triangle_alpha(220, 1))
        print(calculate_triangle_alpha(220, 100))
        print(calculate_triangle_alpha(220,0))
        print(calculate_triangle_alpha(100,20))
      
    except:
        print("Could not start movement. at line:",
              cf.f_lineno, filename)
        # exit()


def main():

    start_movement()


if __name__ == '__main__':
    main()

print('Done...')
