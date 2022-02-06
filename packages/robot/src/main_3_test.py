from leg_calculations_2 import *
# from main_1 import
import unittest


class TestLegCalculations(unittest.TestCase):
    #! TODO: add tests for out of range values
    def test_calculate_angles(self):
        self.assertAlmostEqual(calculate_angles(220, 100, 23)[0], 95,  delta=2)
        self.assertAlmostEqual(calculate_angles(220, 100, 23)[1], 44,  delta=2)
        self.assertAlmostEqual(calculate_angles(220, 100, 23)[2], 150,  delta=2)


class Test_calc_angle_a(unittest.TestCase):
    def test_calc_angle_a(self):
        self.assertEqual(calc_angle_A(193.49, 70, 171.17), 98)
        self.assertEqual(calc_angle_A(171.17, 20, 170), 90)
        self.assertEqual(calc_angle_A(200, 224, 100), 63)


class Test_calc_angle_c(unittest.TestCase):
    def test_calc_angle_c(self):
        self.assertEqual(calc_angle_C(193.49, 70, 238.54), 123)
        self.assertEqual(calc_angle_C(193.49, 70, 164.1), 55)
        # self.assertEqual(calc_angle_C(171.17, 20, 170), 90)
        self.assertEqual(calc_angle_C(205.91, 100, 180), 61)

        self.assertEqual(calc_angle_C(200, 224, 100), 27)



class Test_calculate_triangle_alpha(unittest.TestCase):
    def test_the_return_angle(self):
        self.assertEqual(calculate_triangle_alpha(100, 100)[0],135)
        self.assertEqual(calculate_triangle_alpha(100, -100)[0],45)
        self.assertEqual(calculate_triangle_alpha(100, 0)[0],90)
        self.assertEqual(calculate_triangle_alpha(200, 23)[0],97)
    
    def test_the_return_hypotenuse(self):
        self.assertEqual(int(calculate_triangle_alpha(100, 100)[1]),int(141.42))
        self.assertEqual(int(calculate_triangle_alpha(100, -100)[1]), int(141.42))
        self.assertEqual(int(calculate_triangle_alpha(100, 0)[1]), int(100))
        self.assertEqual(int(calculate_triangle_alpha(200, 23)[1]), int(201.32))

      

class Test_calc_angles(unittest.TestCase):

    def test_calc_motor_position(self):
        self.assertEqual(calc_motor_position(20), 183)
        self.assertEqual(calc_motor_position(90), 474)
        self.assertEqual(calc_motor_position(148), 715)
        self.assertEqual(calc_motor_position(202), 940)
        # self.assertEqual(calc_motor_position(0), 100222)


class Test_clamp_clamp_motor_3_positions(unittest.TestCase):

    def test_clamp_clamp_motor_3_positions_exceeds(self):
        self.assertEqual(clamp_leg_distance(290), 259)
        self.assertEqual(clamp_leg_distance(200), 200)
        self.assertEqual(clamp_leg_distance(1), MIN_REACH_RADIUS) # 130
        self.assertEqual(clamp_leg_distance(
            MIN_REACH_RADIUS-1), MIN_REACH_RADIUS)
        self.assertEqual(clamp_leg_distance(14725), 259)


if __name__ == '__main__':
    unittest.main()
