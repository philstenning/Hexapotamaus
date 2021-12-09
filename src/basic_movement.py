from typing import List
import main_3
import lewansoul_lx16a
import time
import serial
from leg_calculations_2 import *

from inspect import currentframe, getframeinfo
cf = currentframe()
filename = getframeinfo(cf).filename



class Motor(object):
    def __init__(self, controller:lewansoul_lx16a.ServoController, id:int):
        self.id = id
        self.controller = controller

    def set_motor_position(self, angle, time_seconds=1):
        """
        Set the position of this motor
        """
        transition_time = time_seconds * 1000  # we need ms
        motor_position = calc_motor_position(angle)
        try:
            self.controller.move(self.id, motor_position, transition_time)
        except:
            print("Could not move motor:", self.id,
                  filename, '@line:', cf.f_lineno)

    def get_motor_settings(self) :
        offset =int(controller.get_position_offset(self.id)) 
        position = controller.get_position(self.id)
        print('motor_id:', self.id, 'offset:', offset, 'position:', position)
        return offset, position

    def reset_motor_offset(self):
        controller.move(self.id, 500, 1000)# move to middle position so we don't break the servo/arm
        print(controller.get_position(self.id))
        print(controller.get_position_offset(self.id))

        controller.set_position_offset(self.id, 0)
        print(controller.get_position(self.id))





class Leg(object):
    motors: List[Motor] = []

    def __init__(self, controller: lewansoul_lx16a.ServoController, motor_1_id: Motor, motor_2_id: Motor, motor_3_id: Motor, invert_z: bool = False):
        self.motors.append = motor_1_id
        self.motors.append = motor_2_id
        self.motors.append = motor_3_id

        self.controller = controller

    def set_position_by_angles(self, angles: List[int], time_seconds=1):
        """
        Set the position of this leg
        @param angles: [motor_1_angle, motor_2_angle, motor_3_angle]
        """
        for i in range(3):
            self.motors[i].set_motor_position(angles[i], time_seconds)

    def set_position(self, x, y, z, time_seconds=1):
        """
        Set the position of a leg
        @param x: x-coordinate in cm  (out from center of leg joint)
        @param y: y-coordinate in cm (up and down)
        @param z: z-coordinate in cm (forwards and backwards)
        """
        angles = calculate_angles(x, y, z)
        print('angles', angles)
        self.set_position_by_angles(angles, time_seconds)

    def get_current_position(self) -> List[int]:
        """
        @return: [motor_1_angle, motor_2_angle, motor_3_angle]
        this is between 0 and 1000 and not in degrees
        500 is 90 degrees
        """
        angles = []
        for i in range(3):
            angles.append(controller.get_position(self.motors[i].id))
        print('current angles for leg:', angles)
        return angles
    
    def adjust_offsets(self, offsets:List[int]):
        """
        Adjust the offsets of the motors
        @param offsets: [motor_1_offset, motor_2_offset, motor_3_offset]
        """
        if offsets.__len__() != 3:
            print("offsets must be a list of 3 integers")
            return
        before =[]
        after = []
        for i in range(3):
            before.append(controller.get_position_offset(self.motors[i].id))
            self.controller.set_position_offset(self.motors[i].id,int(offsets[i] + before[i]))
            after.append(controller.get_position_offset(self.motors[i].id))
        print('before:', before)
        print('after:', after)
            

# SERIAL_PORT = 'COM4'
# lewansoul_lx16a.init()
# controller = lewansoul_lx16a.ServoController(
#     serial.Serial(SERIAL_PORT, 115200, timeout=1),
# )


# M_1 = Motor(controller, 1)
# M_2 = Motor(controller, 2)
# M_3 = Motor(controller, 3)


# leg_1 = Leg(controller, M_1, M_2, M_3)
# # leg_1.set_angle(90)


