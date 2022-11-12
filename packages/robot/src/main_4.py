from setup import leg_1, leg_2, leg_3, leg_4, leg_5, leg_6
from leg_calculations_2 import calculate_angles
import time
a1 = 90
a2 = 0
a3 = 950


def print_all_legs_positions():
    print(leg_1.get_motor_positions())
    print(leg_2.get_motor_positions())
    print(leg_3.get_motor_positions())
    print(leg_4.get_motor_positions())
    print(leg_5.get_motor_positions())
    print(leg_6.get_motor_positions())


def set_all_legs_positions_by_angles(a1, a2, a3):
    leg_1.set_position_by_angles([a1, a2, a3])
    leg_2.set_position_by_angles([a1, a2, a3])
    leg_3.set_position_by_angles([a1, a2, a3])
    leg_4.set_position_by_angles([a1, a2, a3])
    leg_5.set_position_by_angles([a1, a2, a3])
    leg_6.set_position_by_angles([a1, a2, a3])


# def set_all_legs_rib_cage():
#     leg_1.set_position_by_angles([474, 637, 818])
#     leg_2.set_position_by_angles([475, 621, 812])
#     leg_3.set_position_by_angles([468, 656, 774])
#     leg_4.set_position_by_angles([517, 639, 801])
#     leg_5.set_position_by_angles([500, 641, 807])
#     leg_6.set_position_by_angles([493, 712, 728])


def set_all_legs_position(x, y, z, time=1):
    leg_1.set_position(x, y, z, time)
    leg_2.set_position(x, y, z, time)
    leg_3.set_position(x, y, z, time)
    leg_4.set_position(x, y, z, time)
    leg_5.set_position(x, y, z, time)
    leg_6.set_position(x, y, z, time)


def set_all_legs_walk_start():
    leg_1.set_position(180, 150, 0)
    leg_2.set_position(180, 50, 0)
    leg_3.set_position(180, 150, 0)
    leg_4.set_position(180, 50, 0)
    leg_5.set_position(180, 150, 0)
    leg_6.set_position(180, 50, 0)


def main():
    px = 20
    py = 100
    py2 = 150
    pz = 0

    while True:

        # leg_1.get_motor_positions()
        leg_1.set_position(180, 100, -10, 0.5)
        leg_2.set_position(180, 100, -10, 0.5)
        leg_5.set_position(180, 100, -10, 0.5)
        leg_6.set_position(180, 100, -10, 0.5)
        leg_4.set_position(180, 100, -10, 0.5)
        leg_3.set_position(180, 100, -10, 0.5)
        time.sleep(1)
        leg_1.set_position(180, 160, 30, 0.5)
        leg_2.set_position(180, 160, 30, 0.5)
        leg_3.set_position(180, 160, 30, 0.5)
        leg_4.set_position(180, 160, 30, 0.5)
        leg_5.set_position(180, 160, 30, 0.5)
        leg_6.set_position(180, 160, 30, 0.5)
        # time.sleep(2)
        # time.sleep(2)
        time.sleep(1)
        set_all_legs_walk_start()
        time.sleep(1)
        # leg_5.set_position(120, 30, 20,2)
        # time.sleep(2)
    # leg_6.set_position(px, py, pz)
    # leg_2.set_position(px, py, pz)
    # leg_3.set_position(px, py, pz)
    # leg_6.set_position(px, py, pz)

    # leg_2.set_position(px, py2, pz)
    # leg_4.set_position(px, py2, pz)
    # leg_5.set_position(px, py2, pz)
    # time.sleep(1)
    # leg_1.set_position(px, py2, pz)
    # leg_3.set_position(px, py2, pz)
    # leg_6.set_position(px, py2, pz)

    # leg_2.set_position(px, py, pz)
    # leg_4.set_position(px, py, pz)
    # leg_5.set_position(px, py, pz)
    # time.sleep(1)
    # set_all_legs_walk_start()
    # # set_all_legs_walk_start()
    # time.sleep(1)
    # set_all_legs_position(150, 220, 0)

    # set_all_legs_walk_start()
    # set_all_legs_walk_start()
    # time.sleep(1)
    # set_all_legs_rib_cage()

    # leg_1.set_position_by_angles([a1, a2, a3])
    # leg_2.set_position_by_angles([90,a2,a3])
    # leg_3.set_position_by_angles([90,a2,a3])
    # leg_4.set_position_by_angles([90,a2,a3])
    # leg_5.set_position_by_angles([90,a2,a3])
    # leg_6.set_position_by_angles([90,a2,a3])
    # leg_1.set_position(px, py, pz, 1)
    # leg_1._motors[0].get_motor_settings()
    # leg_1._motors[1].get_motor_settings()
    # leg_1._motors[2].get_motor_settings()
    # leg_2.set_position(px, py, pz, 1)
    # leg_3.set_position(px, py, pz, 1)
    # leg_4.set_position(px, py, pz, 1)
    # leg_5.set_position(px, py, pz, 1)
    # leg_6.set_position(px, py, pz, 1)
    # while True:
    #     leg_1.set_position(px,py,pz,1)
    #     leg_2.set_position(px,py,pz,1)
    #     leg_3.set_position(px,py,pz,1)
    #     leg_4.set_position(px,py,pz,1)
    #     leg_5.set_position(px,py,pz,1)
    #     leg_6.set_position(px,py,pz,1)
    #     time.sleep(1)
    #     py=100
    #     leg_1.set_position(px,py,pz,1)
    #     leg_2.set_position(px,py,pz,1)
    #     leg_3.set_position(px,py,pz,1)
    #     leg_4.set_position(px,py,pz,1)
    #     leg_5.set_position(px,py,pz,1)
    #     leg_6.set_position(px,py,pz,1)
    #     time.sleep(1)

    #     py=220
    # leg_6.print_motor_settings()
    # leg_2.print_motor_settings()
if __name__ == '__main__':
    main()
