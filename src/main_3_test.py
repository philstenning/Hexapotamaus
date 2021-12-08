from leg_calculations_2 import *
# from main_1 import
import unittest


# class Test_Test_calculate_motor_1_angle(unittest.TestCase):
#     def test_calculate_motor_1_angle(self):
#         self.assertEqual(calculate_motor_1_angle(180,234,150), 130)
#         self.assertEqual(calculate_motor_1_angle(180,206,100), 119)
#         # self.assertEqual(calculate_motor_1_angle(170, 100), 120)

#     def test_less_than_zero(self):
#         self.assertEqual(calculate_motor_1_angle(180,206,-100), 61)
#         self.assertEqual(calculate_motor_1_angle(170, 170,0), 90)
#         self.assertEqual(calculate_motor_1_angle(170,197, -100), 60)


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
        # self.assertEqual(calculate_triangle_alpha(100, 100, 200), 60)
        # self.assertEqual(calculate_triangle_alpha(100, 200, 100), 45)
        # self.assertEqual(calculate_triangle_alpha(200, 100, 100), 135)
# class Test_calculate_angles(unittest.TestCase):
#     def test_calc_angles(self):
#         self.assertAlmostEqual(calculate_angles(220, 50, 1)[0], 90, delta=2)
#         self.assertAlmostEqual(calculate_angles(220, 50, 1)[1], 13, delta=2)
#         self.assertAlmostEqual(calculate_angles(220, 50, 1)[2], 168, delta=2)
    #     self.assertAlmostEqual(calc_angles(180, 120, 150)[1], 113,delta=2)
    #     self.assertAlmostEqual(calc_angles(180, 120, 150)[2], 60,delta=2)
    #     self.assertAlmostEqual(calc_angles(180, 120, 140)[0], 128,delta=2)
    #     self.assertAlmostEqual(calc_angles(180, 120, 140)[1], 98,delta=2)
    #     self.assertAlmostEqual(calc_angles(180, 120, 140)[2], 81,delta=2)

    # def test_calc_angles_motor_1_negative_values(self):
    #     self.assertAlmostEqual(calc_angles(180, 120, -140)[0], 52,delta=2)
    #     self.assertAlmostEqual(calc_angles(180, 120, -140)[1], 98,delta=2)
    #     self.assertAlmostEqual(calc_angles(180, 120, -140)[2], 81,delta=2)
    #     #
    #     self.assertAlmostEqual(calc_angles(180, 120, -1)[0], 90,delta=2)
    #     self.assertAlmostEqual(calc_angles(180, 120, -1)[1], 62,delta=2)
    #     self.assertAlmostEqual(calc_angles(180, 120, -1)[2], 135,delta=2)

    # self.assertAlmostEqual(calc_angles(180, 120, 150)[0], 130,delta=2)
    # self.assertAlmostEqual(calc_angles(180, 120, 150)[1], 113,delta=2)
    # self.assertAlmostEqual(calc_angles(180, 120, 150)[2], 60,delta=2)


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
        self.assertEqual(clamp_leg_distance(1), 148)
        self.assertEqual(clamp_leg_distance(147), 148)
        self.assertEqual(clamp_leg_distance(14725), 259)


if __name__ == '__main__':
    unittest.main()
