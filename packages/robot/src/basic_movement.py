from typing import List

import lewansoul_lx16a
import time
import serial
from leg_calculations_2 import *

from inspect import currentframe, getframeinfo
cf = currentframe()
filename = getframeinfo(cf).filename


class Motor(object):
    def __init__(self, controller: lewansoul_lx16a.ServoController, id: int):
        self.id = id
        self.controller = controller

    def set_motor_position(self, angle, time_seconds=1) -> None:
        """ Set the position of this motor
        """
        transition_time = time_seconds * 1000  # we need ms
        motor_position = calc_motor_position(angle)
        try:
            self.controller.move(self.id, motor_position, transition_time)
        except:
            print("Could not move motor:", self.id,
                  filename, '@line:', cf.f_lineno)

    def get_motor_settings(self):
        offset = int(self.controller.get_position_offset(self.id))
        position = self.controller.get_position(self.id)
        d = self.controller.get_position_limits(self.id)
        temp= self.controller.get_temperature(self.id)
        print('motor_id:', self.id, 'offset:', offset, 'position:', position , 
            'temp',temp , 'limits:', d)
        return offset, position

    def set_postion_limits(self, min, max):
        self.controller.set_position_limits(self.id, min, max)

    def reset_motor_offset(self):
        # move to middle position so we don't break the servo/arm
        self.controller.move(self.id, 500, 1000)
        print(self.controller.get_position(self.id))
        print(self.controller.get_position_offset(self.id))

        self.controller.set_position_offset(self.id, 0)
        print(self.controller.get_position(self.id))


class Leg(object):
    """A single Leg of the robot.

    Attributes:
    controller: The ServoController object.
    motors_1: The Motor  attached to the body.
    motors_2: The Motor  attached between motor_1 and motor_3.
    motors_3: The Motor  attached after motor_2 and before the 
              part of the leg than touches the ground plane.
    """

    def __init__(self, controller: lewansoul_lx16a.ServoController, motor_1: Motor, motor_2: Motor, motor_3: Motor, invert_z: bool = False):
        self._motors: List[Motor] = []
        self._motors.append(motor_1)
        self._motors.append(motor_2)
        self._motors.append(motor_3)

        self._controller = controller

    def set_position_by_angles(self, angles: List[int] = [90, 90, 90], time_seconds=1):
        """Set the position of this leg in degrees

        Args:
        angles: [motor_1_angle, motor_2_angle, motor_3_angle]

        Returns:
        null
        """
        if angles.__len__() != 3:
            print("angles must be a list of 3 integers")
            return
        for i in range(3):
            print(self._motors[i].id, angles[i])
            self._motors[i].set_motor_position(angles[i], time_seconds)

    def set_position(self, x: int, y: int, z: int, time_seconds: int = 1):
        """Set the position of a leg

        Args:
        x: x-coordinate in cm  (out from center of leg joint)
        y: y-coordinate in cm (up and down)
        z: z-coordinate in cm (forwards and backwards)
        """
        angles = calculate_angles(x, y, z)
        print('angles', angles)
        self.set_position_by_angles(angles, time_seconds)

    def get_motor_positions(self) -> List[int]:
        """ Get the current position of the motors

        Returns: 
        [motor_1_angle, motor_2_angle, motor_3_angle]

        !Note this is between 0 and 1000 and not in degrees;
        where 500 is 90 degrees
        """
        motor_positions: List[int] = []
        for i in range(3):
            motor_positions.append(
                self._controller.get_position(self._motors[i].id))
        # print('current motor_positions for leg:', motor_positions)
        return motor_positions

    def adjust_offsets(self, offsets: List[int]):
        """ Adjust the offsets of the motors

        Args:
        offsets: [motor_1_offset, motor_2_offset, motor_3_offset]
        """
        if offsets.__len__() != 3:
            print("offsets must be a list of 3 integers")
            return
        before = []
        after: List[int] = []
        for i in range(3):
            before.append(
                self._controller.get_position_offset(self._motors[i].id))
            self._controller.set_position_offset(
                self._motors[i].id, int(offsets[i] + before[i]))
            after.append(
                self._controller.get_position_offset(self._motors[i].id))
        print('before:', before)
        print('after:', after)
        return after

    def print_motor_settings(self):
        """ Print the current settings of the motors for debugging"""
        for i in range(3):
            self._motors[i].get_motor_settings()
    
    def log_temperature(self):
        """ Log the temperature of the motors"""
        for i in range(3):
            print(self._controller.get_temperature(self._motors[i].id))


# class Leg
#!TODO LEG GROUP
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
